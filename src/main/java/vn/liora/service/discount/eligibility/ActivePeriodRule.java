package vn.liora.service.discount.eligibility;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.service.discount.DiscountContext;

import java.time.LocalDateTime;

@Component
@Order(1)
public class ActivePeriodRule implements DiscountEligibilityRule {
    @Override
    public DiscountEligibilityResult check(Discount discount, DiscountContext context) {
        LocalDateTime appliedAt = context.safeAppliedAt();
        boolean active = Boolean.TRUE.equals(discount.getIsActive())
                && !appliedAt.isBefore(discount.getStartDate())
                && !appliedAt.isAfter(discount.getEndDate());

        return active
                ? DiscountEligibilityResult.valid()
                : DiscountEligibilityResult.invalid("Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng");
    }
}

