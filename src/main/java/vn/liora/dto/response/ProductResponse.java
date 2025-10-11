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
public class ProductResponse {
    private Long productId;
    private String name;
    private String description;
    private BigDecimal price;

    // Brand info
    private Long brandId;
    private String brandName;

    // Category info
    private Long categoryId;
    private String categoryName;

    private Integer stock;
    private Integer soldCount;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private Boolean available;
    private BigDecimal averageRating;
    private Integer ratingCount;
    private Boolean isActive;

    // Thêm field này
    private String mainImageUrl;
}
