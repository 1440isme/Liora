package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartProductResponse {
    Long idCart;
    Long idProduct;
    Long idCartProduct;
    Integer quantity;
    Boolean choose;
    BigDecimal totalPrice;
}
