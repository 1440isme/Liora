package vn.liora.service.discount.calculator;

import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.enums.DiscountType;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;

@Component
public class FixedAmountDiscountCalculator implements DiscountCalculator {
    @Override
    public DiscountType supports() {
        return DiscountType.FIXED_AMOUNT;
    }

    @Override
    public BigDecimal calculate(Discount discount, DiscountContext context) {
        return discount.getDiscountValue().min(context.safeSubtotal()).max(BigDecimal.ZERO);
    }
}
