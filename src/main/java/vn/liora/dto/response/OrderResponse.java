package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    Long idOrder;
    LocalDateTime orderDate;
    Boolean orderStatus;
    String paymentMethod;
    Boolean paymentStatus;
    BigDecimal shippingFee;
    BigDecimal totalDiscount;
    BigDecimal total;
    Long idUser;

}
