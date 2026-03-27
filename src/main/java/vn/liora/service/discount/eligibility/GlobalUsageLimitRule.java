package vn.liora.service.discount.eligibility;

import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.service.discount.DiscountContext;

@Component
public class GlobalUsageLimitRule implements DiscountEligibilityRule {
    @Override
    public DiscountEligibilityResult check(Discount discount, DiscountContext context) {
        if (discount.getUsageLimit() == null) {
            return DiscountEligibilityResult.valid();
        }

        return discount.getUsedCount() < discount.getUsageLimit()
                ? DiscountEligibilityResult.valid()
                : DiscountEligibilityResult.invalid("Mã giảm giá đã hết lượt sử dụng");
    }
}

