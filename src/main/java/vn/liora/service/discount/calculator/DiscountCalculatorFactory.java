package vn.liora.service.discount.calculator;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.liora.enums.DiscountType;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DiscountCalculatorFactory {
    private final List<DiscountCalculator> calculators;

    public DiscountCalculator getCalculator(DiscountType discountType) {
        return calculators.stream()
                .filter(calculator -> calculator.supports() == discountType)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No calculator registered for " + discountType));
    }
}
