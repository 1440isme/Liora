package vn.liora.service.discount.calculator;

import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.enums.DiscountType;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;

@Component
public class FreeShippingDiscountCalculator implements DiscountCalculator {
    @Override
    public DiscountType supports() {
        return DiscountType.FREE_SHIPPING;
    }

    @Override
    public BigDecimal calculate(Discount discount, DiscountContext context) {
        return context.safeShippingFee().max(BigDecimal.ZERO);
    }
}
