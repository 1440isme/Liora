package vn.liora.service.discount;

import lombok.Builder;
import lombok.Value;
import vn.liora.entity.Discount;

import java.math.BigDecimal;

@Value
@Builder
public class DiscountApplicationResult {
    boolean applied;
    Discount discount;
    BigDecimal discountAmount;
    BigDecimal shippingDiscountAmount;
    BigDecimal finalDiscountAmount;
    String failureReason;

    public static DiscountApplicationResult rejected(Discount discount, String failureReason) {
        return DiscountApplicationResult.builder()
                .applied(false)
                .discount(discount)
                .discountAmount(BigDecimal.ZERO)
                .shippingDiscountAmount(BigDecimal.ZERO)
                .finalDiscountAmount(BigDecimal.ZERO)
                .failureReason(failureReason)
                .build();
    }
}
