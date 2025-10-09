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
    CATEGORY_PARENT_INACTIVE(2009, "Cannot activate category because parent category is inactive", HttpStatus.BAD_REQUEST),
    CATEGORY_CIRCULAR_REFERENCE(2010, "Category cannot be parent of itself", HttpStatus.BAD_REQUEST),
    CATEGORY_INVALID_PARENT_LOGIC(2011, "Category with parent cannot be parent category", HttpStatus.BAD_REQUEST),


    // Hanh: 3000 - 3999
    // Thêm các error codes này vào enum ErrorCode
    ADDRESS_NOT_FOUND(3000, "Address not found", HttpStatus.NOT_FOUND),
    CANNOT_DELETE_DEFAULT_ADDRESS(3001, "Cannot delete default address when other addresses exist", HttpStatus.BAD_REQUEST),
    DEFAULT_ADDRESS_NOT_FOUND(3002, "Default address not found", HttpStatus.NOT_FOUND),
    CART_NOT_FOUND(3003, "Cart not found", HttpStatus.NOT_FOUND),
    CART_PRODUCT_NOT_FOUND(3004, "Cart product not found", HttpStatus.NOT_FOUND),
    ORDER_NOT_FOUND(3005, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_PRODUCT_NOT_FOUND(3006, "Order product not found", HttpStatus.NOT_FOUND),
    CART_ALREADY_EXISTS(3007, "Cart already exists for this user", HttpStatus.BAD_REQUEST),
    INVALID_CART_QUANTITY(3008, "Invalid cart quantity", HttpStatus.BAD_REQUEST),
    INVALID_ORDER_STATUS(3009, "Invalid order status", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BE_CANCELLED(3010, "Order cannot be cancelled in current status", HttpStatus.BAD_REQUEST),
    PRODUCT_OUT_OF_STOCK(3011, "Product is out of stock", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(3012, "Insufficient product stock", HttpStatus.BAD_REQUEST),


    VALIDATION_PHONE_INVALID_LENGTH(3013, "Phone number must be exactly 10 digits", HttpStatus.BAD_REQUEST),
    VALIDATION_QUANTITY_MIN_ONE(3014, "Quantity must be at least 1", HttpStatus.BAD_REQUEST),
    
    // Khoi: 4000 - 4999 (Review & Discount)
    REVIEW_NOT_FOUND(4000, "Review not found", HttpStatus.NOT_FOUND),
    REVIEW_NOT_ALLOWED(4001, "User is not allowed to review this product", HttpStatus.BAD_REQUEST),
    REVIEW_ALREADY_EXISTS(4002, "Review already exists for this order product", HttpStatus.BAD_REQUEST),
    DISCOUNT_NOT_FOUND(4003, "Discount not found", HttpStatus.NOT_FOUND),
    DISCOUNT_NAME_ALREADY_EXISTS(4004, "Discount name already exists", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE(4005, "Invalid date range", HttpStatus.BAD_REQUEST),
    DISCOUNT_CANNOT_BE_APPLIED(4006, "Discount cannot be applied", HttpStatus.BAD_REQUEST),
    VALIDATION_DISCOUNT_TYPE_TOO_LONG(4007, "Discount type must not exceed 50 characters", HttpStatus.BAD_REQUEST),

    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
