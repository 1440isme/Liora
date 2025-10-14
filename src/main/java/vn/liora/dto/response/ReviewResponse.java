package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewResponse {
    private Long reviewId;
    private String content;
    private Integer rating;
    private Boolean anonymous;
    private Boolean isVisible;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdate;

    // User info
    private Long userId;
    private String userFirstname;
    private String userLastname;
    private String userAvatar;
    private String userDisplayName; // Computed field for display
    private String userEmail; // Thêm email
    private String userPhone; // Thêm số điện thoại
    private String productImage;
    private String productThumbnail; // Thêm field này

    // Product info
    private Long productId;
    private String productName;
    private BigDecimal productPrice; // Thêm giá sản phẩm
    private String productBrandName; // Thêm tên thương hiệu
    private String productCategoryName; // Thêm tên danh mục

    // Order info
    private Long orderProductId;
    private Long orderId; // Thêm ID đơn hàng
    private String orderCode; // Thêm mã đơn hàng
    private LocalDateTime orderDate; // Thêm ngày đặt hàng

    // Helper method to get display name
    public String getUserDisplayName() {
        if (Boolean.TRUE.equals(anonymous)) {
            return "Anonymous User";
        }
        if (userFirstname != null && userLastname != null) {
            return userFirstname + " " + userLastname;
        }
        return "User";
    }
}