package vn.liora.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    // Binh: 1001 - 1999
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003, "User not found", HttpStatus.NOT_FOUND),
    USERNAME_INVALID(1004, "Username must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1005, "Password must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1006, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1007, "Unauthenticated",HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1008, "You do not have permission",HttpStatus.FORBIDDEN),
    INVALID_DOB(1009, "Your age has must be at least {min}",HttpStatus.BAD_REQUEST),
    // Dai: 2000 - 2999
    BRAND_EXISTED(2000, "Brand existed", HttpStatus.BAD_REQUEST),
    BRAND_NOT_FOUND(2001, "Brand not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(2002, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_EXISTED(2003, "Category existed", HttpStatus.BAD_REQUEST),
    VALIDATION_NAME_TOO_LONG(2004, "Name must not exceed 255 characters", HttpStatus.BAD_REQUEST),
    VALIDATION_ICON_TOO_LONG(2005, "Icon path must not exceed 255 characters", HttpStatus.BAD_REQUEST),
    VALIDATION_REQUIRED_FIELD(2006, "This field is required", HttpStatus.BAD_REQUEST),
    PRODUCT_EXISTED(2007, "Product existed", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(2008, "Product not found", HttpStatus.NOT_FOUND),

    // Hanh: 3000 - 3999

    // Khoi: 4000 - 4999

    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
