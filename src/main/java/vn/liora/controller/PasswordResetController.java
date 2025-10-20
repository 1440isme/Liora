package vn.liora.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ForgotPasswordRequest;
import vn.liora.dto.request.ResetPasswordRequest;
import vn.liora.exception.AppException;
import vn.liora.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /**
     * Gửi email reset password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            log.info("Received forgot password request for email: {}", request.getEmail());
            passwordResetService.sendPasswordResetEmail(request);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(1000);
            response.setMessage("Email đặt lại mật khẩu đã được gửi đến " + request.getEmail());
            response.setResult(null);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            log.error("AppException in forgot password: {}", e.getMessage());
            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getMessage());
            response.setResult(null);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Unexpected error in forgot password: {}", e.getMessage(), e);
            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(9999);
            response.setMessage("Có lỗi xảy ra: " + e.getMessage());
            response.setResult(null);
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Reset password với token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(1000);
            response.setMessage("Đặt lại mật khẩu thành công");
            response.setResult(null);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in reset password: {}", e.getMessage());

            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(9999);
            response.setMessage("Có lỗi xảy ra: " + e.getMessage());
            response.setResult(null);

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Kiểm tra token có hợp lệ không
     */
    @GetMapping("/validate-token")
    public ResponseEntity<ApiResponse<Object>> validateToken(@RequestParam String token) {
        try {
            boolean isValid = passwordResetService.isValidToken(token);

            ApiResponse<Object> response = new ApiResponse<>();
            if (isValid) {
                response.setCode(1000);
                response.setMessage("Token hợp lệ");
            } else {
                response.setCode(1013);
                response.setMessage("Token không hợp lệ hoặc đã hết hạn");
            }
            response.setResult(isValid);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());

            ApiResponse<Object> response = new ApiResponse<>();
            response.setCode(9999);
            response.setMessage("Có lỗi xảy ra: " + e.getMessage());
            response.setResult(false);

            return ResponseEntity.badRequest().body(response);
        }
    }
}
