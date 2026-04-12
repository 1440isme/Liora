package vn.liora.service.discount.eligibility;

import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.repository.OrderRepository;
import vn.liora.service.discount.DiscountContext;

@Component
@Order(4)
@RequiredArgsConstructor
public class UserUsageLimitRule implements DiscountEligibilityRule {
    private final OrderRepository orderRepository;

    @Override
    public DiscountEligibilityResult check(Discount discount, DiscountContext context) {
        if (discount.getUserUsageLimit() == null || context.getUserId() == null) {
            return DiscountEligibilityResult.valid();
        }

        Long userUsageCount = orderRepository.countOrdersByUserAndDiscount(context.getUserId(), discount.getDiscountId());
        return userUsageCount < discount.getUserUsageLimit()
                ? DiscountEligibilityResult.valid()
                : DiscountEligibilityResult.invalid("Bạn đã hết lượt dùng mã giảm giá này");
    }
}

