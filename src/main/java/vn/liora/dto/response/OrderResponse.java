package vn.liora.dto.response;

import jakarta.validation.constraints.NotNull;
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
    String name;
    String phone;
    String addressDetail;
    String email;
    String note;
    LocalDateTime orderDate;
    String orderStatus;
    String paymentMethod;
    Boolean paymentStatus;
    BigDecimal shippingFee;
    BigDecimal totalDiscount;
    BigDecimal total;
    Long idAddress;
    Long userId;
    String customerName; // Thêm field để hiển thị tên khách hàng
}
