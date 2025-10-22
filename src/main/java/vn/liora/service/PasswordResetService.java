package vn.liora.service;

import vn.liora.dto.request.ForgotPasswordRequest;
import vn.liora.dto.request.ResetPasswordRequest;

public interface PasswordResetService {

    /**
     * Gửi email reset password
     */
    void sendPasswordResetEmail(ForgotPasswordRequest request);

    /**
     * Reset password với token
     */
    void resetPassword(ResetPasswordRequest request);

    /**
     * Kiểm tra token có hợp lệ không
     */
    boolean isValidToken(String token);
}
