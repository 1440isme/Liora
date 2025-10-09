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
    BRAND_EXISTED(400, "Brand existed", HttpStatus.BAD_REQUEST),
    BRAND_NOT_FOUND(404, "Brand not found", HttpStatus.NOT_FOUND),
    
    // Category errors
    CATEGORY_NOT_FOUND(404, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_EXISTED(400, "Category existed", HttpStatus.BAD_REQUEST),
    CATEGORY_PARENT_INACTIVE(400, "Cannot activate category because parent category is inactive", HttpStatus.BAD_REQUEST),
    CATEGORY_CIRCULAR_REFERENCE(400, "Category cannot be parent of itself", HttpStatus.BAD_REQUEST),
    CATEGORY_INVALID_PARENT_LOGIC(400, "Category with parent cannot be parent category", HttpStatus.BAD_REQUEST),
    
    // Product errors
    PRODUCT_EXISTED(400, "Product existed", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(404, "Product not found", HttpStatus.NOT_FOUND),
    PRODUCT_NAME_ALREADY_EXISTS(409, "Product name already exists", HttpStatus.CONFLICT),
    
    // Validation errors
    VALIDATION_NAME_TOO_LONG(400, "Name must not exceed 255 characters", HttpStatus.BAD_REQUEST),
    VALIDATION_ICON_TOO_LONG(400, "Icon path must not exceed 255 characters", HttpStatus.BAD_REQUEST),
    VALIDATION_REQUIRED_FIELD(400, "This field is required", HttpStatus.BAD_REQUEST),
    
    // Product validation errors
    PRODUCT_NAME_REQUIRED(400, "Product name is required", HttpStatus.BAD_REQUEST),
    PRODUCT_DESCRIPTION_REQUIRED(400, "Product description is required", HttpStatus.BAD_REQUEST),
    PRODUCT_PRICE_REQUIRED(400, "Product price is required", HttpStatus.BAD_REQUEST),
    PRODUCT_PRICE_INVALID(400, "Product price must be at least 0.01", HttpStatus.BAD_REQUEST),
    PRODUCT_PRICE_TOO_HIGH(400, "Product price cannot exceed 99,999,999.99", HttpStatus.BAD_REQUEST),
    PRODUCT_STOCK_INVALID(400, "Product stock cannot be negative", HttpStatus.BAD_REQUEST),
    PRODUCT_BRAND_REQUIRED(400, "Product brand is required", HttpStatus.BAD_REQUEST),
    PRODUCT_CATEGORY_REQUIRED(400, "Product category is required", HttpStatus.BAD_REQUEST),
    PRODUCT_RATING_INVALID(400, "Product rating must be between 0.0 and 5.0", HttpStatus.BAD_REQUEST),
    PRODUCT_STOCK_TOO_HIGH(400, "Product stock cannot exceed 999,999", HttpStatus.BAD_REQUEST),
    PRODUCT_SOLD_COUNT_INVALID(400, "Product stock cannot be negative", HttpStatus.BAD_REQUEST),
    PRODUCT_SOLD_COUNT_TOO_HIGH(400, "Sold count cannot exceed 999,999", HttpStatus.BAD_REQUEST),
    // Hanh: 3000 - 3999

    // Khoi: 4000 - 4999

    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
