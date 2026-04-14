package vn.liora.service.discount.eligibility;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DiscountEligibilityResult {
    boolean valid;
    String reason;

    public static DiscountEligibilityResult valid() {
        return DiscountEligibilityResult.builder()
                .valid(true)
                .build();
    }

    public static DiscountEligibilityResult invalid(String reason) {
        return DiscountEligibilityResult.builder()
                .valid(false)
                .reason(reason)
                .build();
    }
}
