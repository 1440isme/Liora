package vn.liora.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    Long idCart;
    Long idProduct;
    Long idCartItem;
    Integer quantity;
    Boolean choose;
    BigDecimal totalPrice;

    String productName;
    BigDecimal productPrice;
    String mainImageUrl;
    String brandName;
    Long brandId;

    Boolean available;
    Boolean isActive;
    Integer stock;
}
