package vn.liora.service.discount.eligibility;

import vn.liora.entity.Discount;
import vn.liora.service.discount.DiscountContext;

public interface DiscountEligibilityRule {
    DiscountEligibilityResult check(Discount discount, DiscountContext context);
}
