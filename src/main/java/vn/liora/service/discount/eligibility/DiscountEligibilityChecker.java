package vn.liora.service.discount.eligibility;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.liora.entity.Discount;
import vn.liora.service.discount.DiscountContext;

import java.util.List;

/**
 * Runs {@link DiscountEligibilityRule} beans in ascending {@link org.springframework.core.annotation.Order}
 * (Spring sorts the injected list).
 */
@Component
@RequiredArgsConstructor
public class DiscountEligibilityChecker {
    private final List<DiscountEligibilityRule> rules;

    public DiscountEligibilityResult check(Discount discount, DiscountContext context) {
        for (DiscountEligibilityRule rule : rules) {
            DiscountEligibilityResult result = rule.check(discount, context);
            if (!result.isValid()) {
                return result;
            }
        }
        return DiscountEligibilityResult.valid();
    }
}
