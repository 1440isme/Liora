package vn.liora.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    INVALID_KEY(1001, "Invalid message key"),
    USER_EXISTED(1002, "User existed"),
    USER_NOT_FOUND(1003, "User not found"),
    USERNAME_INVALID(1004, "Username must be at least 3 characters long"),
    PASSWORD_INVALID(1005, "Password must be at least 8 characters long"),
    BRAND_EXISTED(1006, "Brand existed"),
    BRAND_NOT_FOUND(1007, "Brand not found"),
    CATEGORY_NOT_FOUND(2005, "Category not found"),
    CATEGORY_EXISTED(2006, "Category existed"),
    VALIDATION_NAME_TOO_LONG(2007, "Name must not exceed 255 characters"),
    VALIDATION_ICON_TOO_LONG(2008, "Icon path must not exceed 255 characters"),
    VALIDATION_REQUIRED_FIELD(3000, "This field is required"),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003, "User not found", HttpStatus.NOT_FOUND),
    USERNAME_INVALID(1004, "Username must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1005, "Password must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1006, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1007, "Unauthenticated",HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1008, "You do not have permission",HttpStatus.FORBIDDEN),
    INVALID_DOB(1009, "Your age has must be at least {min}",HttpStatus.BAD_REQUEST)

    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
