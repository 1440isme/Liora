package vn.liora.service.discount;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Value;

@Value
@Builder

// DiscountContext chỉ là một context object hay parameter object,
// dùng để gom dữ liệu đầu vào chung cho việc tính discount như:
// orderSubtotal, shippingFee, userId, appliedAt.
public class DiscountContext {
    Long userId;
    BigDecimal orderSubtotal; // tổng tiền hàng trc khi áp dụng discount
    BigDecimal shippingFee; // phí vận chuyển
    String paymentMethod;
    LocalDateTime appliedAt;

    public BigDecimal safeSubtotal() {
        return orderSubtotal != null ? orderSubtotal : BigDecimal.ZERO;
    }

    public BigDecimal safeShippingFee() {
        return shippingFee != null ? shippingFee : BigDecimal.ZERO;
    }

    public LocalDateTime safeAppliedAt() {
        return appliedAt != null ? appliedAt : LocalDateTime.now();
    }
}
