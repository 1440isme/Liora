package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    Long idOrderItem;
    Long idProduct;
    Long idOrder;
    Integer quantity;
    BigDecimal totalPrice;
    String productName;
    String productDescription;
    BigDecimal productPrice;
    String mainImageUrl;
    String categoryName;
    String brandName;
    Long brandId;
}
