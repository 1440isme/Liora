package vn.liora.service.discount.calculator;

import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.enums.DiscountType;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PercentageDiscountCalculator implements DiscountCalculator {
    @Override
    public DiscountType supports() {
        return DiscountType.PERCENTAGE;
    }

    @Override
    public BigDecimal calculate(Discount discount, DiscountContext context) {
        BigDecimal orderTotal = context.safeSubtotal();
        if (orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountAmount = orderTotal
                .multiply(discount.getDiscountValue())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        if (discount.getMaxDiscountAmount() != null
                && discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
            return discount.getMaxDiscountAmount();
        }

        return discountAmount.max(BigDecimal.ZERO);
    }
}
