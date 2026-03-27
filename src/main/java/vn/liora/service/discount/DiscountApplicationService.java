package vn.liora.service.discount;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.liora.entity.Discount;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.DiscountRepository;
import vn.liora.service.discount.calculator.DiscountCalculator;
import vn.liora.service.discount.calculator.DiscountCalculatorFactory;
import vn.liora.service.discount.eligibility.DiscountEligibilityChecker;
import vn.liora.service.discount.eligibility.DiscountEligibilityResult;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DiscountApplicationService {
    private final DiscountRepository discountRepository;
    private final DiscountEligibilityChecker eligibilityChecker;
    private final DiscountCalculatorFactory calculatorFactory;

    public DiscountApplicationResult apply(Long discountId, DiscountContext context) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        return apply(discount, context);
    }

    public DiscountApplicationResult apply(Discount discount, DiscountContext context) {
        DiscountEligibilityResult eligibility = eligibilityChecker.check(discount, context);
        if (!eligibility.isValid()) {
            return DiscountApplicationResult.rejected(discount, eligibility.getReason());
        }

        DiscountCalculator calculator = calculatorFactory.getCalculator(discount.getDiscountType());
        BigDecimal amount = calculator.calculate(discount, context);

        return DiscountApplicationResult.builder()
                .applied(true)
                .discount(discount)
                .discountAmount(amount)
                .shippingDiscountAmount(BigDecimal.ZERO)
                .finalDiscountAmount(amount)
                .build();
    }
}
