package vn.liora.service.discount;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class DiscountContext {
    Long userId;
    BigDecimal orderSubtotal;
    BigDecimal shippingFee;
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
