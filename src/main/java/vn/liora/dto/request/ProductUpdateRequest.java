package vn.liora.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductUpdateRequest {
    @Size(max = 255, message = "VALIDATION_NAME_TOO_LONG")
    private String name;

    private String description;

    @DecimalMin(value = "0.0", message = "VALIDATION_PRICE_POSITIVE")
    private BigDecimal price;

    private Long brandId;
    private Long categoryId;

    /**
     * Số lượng muốn nhập thêm (delta), không phải tổng tồn kho mục tiêu.
     * null: giữ nguyên tồn kho; 0: không thêm item; số dương: thêm đúng bấy nhiêu {@code ProductItem} IN_STOCK.
     */
    @Min(value = 0, message = "VALIDATION_STOCK_NON_NEGATIVE")
    private Integer stock;

    private Boolean available;
    private Boolean isActive;
}
