package vn.liora.service.discount.eligibility;

import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;

@Component
public class MinOrderValueRule implements DiscountEligibilityRule {
    @Override
    public DiscountEligibilityResult check(Discount discount, DiscountContext context) {
        BigDecimal minOrderValue = discount.getMinOrderValue();
        if (minOrderValue == null) {
            return DiscountEligibilityResult.valid();
        }

        return context.safeSubtotal().compareTo(minOrderValue) >= 0
                ? DiscountEligibilityResult.valid()
                : DiscountEligibilityResult.invalid("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá");
    }
}

