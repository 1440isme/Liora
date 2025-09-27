package vn.liora.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    INVALID_KEY(1001, "Invalid message key"),
    USER_EXISTED(1002, "User existed"),
    USER_NOT_FOUND(1003, "User not found"),
    USERNAME_INVALID(1004, "Username must be at least 3 characters long"),
    PASSWORD_INVALID(1005, "Password must be at least 8 characters long"),

    ;
    private int code;
    private String message;

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
