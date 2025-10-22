package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ForgotPasswordRequest;
import vn.liora.dto.request.ResetPasswordRequest;
import vn.liora.entity.PasswordResetToken;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.PasswordResetTokenRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.EmailService;
import vn.liora.service.PasswordResetService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final int TOKEN_EXPIRY_HOURS = 1; // Token hết hạn sau 1 giờ

    @Override
    @Transactional
    public void sendPasswordResetEmail(ForgotPasswordRequest request) {
        String email = request.getEmail();
        log.info("Attempting to send password reset email to: {}", email);

        // Kiểm tra user có tồn tại không
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            log.warn("User not found with email: {}", email);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        User user = userOptional.get();
        log.info("User found: {}", user.getUsername());

        // Xóa token cũ nếu có
        tokenRepository.deleteByEmail(email);

        // Tạo token mới
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .expiryDate(expiryDate)
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // Gửi email
        try {
            emailService.sendPasswordResetEmail(email, user.getFirstname() + " " + user.getLastname(), token);
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", email, e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        // Kiểm tra mật khẩu xác nhận
        if (!newPassword.equals(confirmPassword)) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        // Tìm token hợp lệ
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        // Kiểm tra token chưa hết hạn
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        // Tìm user
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Cập nhật mật khẩu
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Đánh dấu token đã sử dụng
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset successful for user: {}", user.getEmail());
    }

    @Override
    public boolean isValidToken(String token) {
        try {
            PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                    .orElse(null);

            if (resetToken == null) {
                return false;
            }

            // Kiểm tra token chưa hết hạn
            return !resetToken.getExpiryDate().isBefore(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }
}
