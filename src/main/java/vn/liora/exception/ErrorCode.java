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
    EMAIL_EXISTED(1010, "Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003, "User not found", HttpStatus.NOT_FOUND),
    USERNAME_INVALID(1004, "Username must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1005, "Password must be at least {min} characters long", HttpStatus.BAD_REQUEST),
    ACCOUNT_LOCKED(1011, "Account is locked", HttpStatus.FORBIDDEN),
    USER_NOT_EXISTED(1006, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1007, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1008, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1009, "Your age has must be at least {min}", HttpStatus.BAD_REQUEST),
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
    PRODUCT_HAS_ORDERS(400, "Cannot delete product that has been sold", HttpStatus.BAD_REQUEST),
    
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
    // Thêm vào ErrorCode.java
    IMAGE_NOT_FOUND(404, "Image not found", HttpStatus.NOT_FOUND),
    INVALID_FILE_TYPE(400, "Invalid file type", HttpStatus.BAD_REQUEST),
    TOO_MANY_IMAGES(400, "Too many images for this product", HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(500, "Upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    IMAGE_NOT_BELONG_TO_PRODUCT(400, "Image does not belong to this product", HttpStatus.BAD_REQUEST),
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
    NO_SELECTED_PRODUCT(400, "No selected product", HttpStatus.BAD_REQUEST),
    CANNOT_REMOVE_DEFAULT_ADDRESS(400,  "Cannot remove default address", HttpStatus.BAD_REQUEST),
    // Khoi: 4000 - 4999 (Review & Discount)
    REVIEW_NOT_FOUND(400, "Review not found", HttpStatus.NOT_FOUND),
    REVIEW_NOT_ALLOWED(401, "User is not allowed to review this product", HttpStatus.BAD_REQUEST),
    REVIEW_ALREADY_EXISTS(402, "Review already exists for this order product", HttpStatus.BAD_REQUEST),
    REVIEW_ACCESS_DENIED(403, "Access denied to this review", HttpStatus.FORBIDDEN),
    ORDER_NOT_PAID(404, "Order has not been paid yet", HttpStatus.BAD_REQUEST),
    ORDER_INVALID(405, "Order is invalid or cancelled", HttpStatus.BAD_REQUEST),
    DISCOUNT_NOT_FOUND(406, "Discount not found", HttpStatus.NOT_FOUND),
    DISCOUNT_NAME_ALREADY_EXISTS(407, "Discount name already exists", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE(408, "Invalid date range", HttpStatus.BAD_REQUEST),
    DISCOUNT_CANNOT_BE_APPLIED(409, "Discount cannot be applied", HttpStatus.BAD_REQUEST),
    VALIDATION_DISCOUNT_TYPE_TOO_LONG(410, "Discount type must not exceed 50 characters", HttpStatus.BAD_REQUEST),
    DISCOUNT_NOT_APPLIED_TO_ORDER(411, "Discount is not applied to this order", HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(412, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    ORDER_NOT_DELIVERED(413, "Order has not been delivered yet", HttpStatus.BAD_REQUEST),
    ;

    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
