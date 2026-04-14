package vn.liora.service.discount.calculator;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.liora.enums.DiscountType;

import java.util.List;

@Component
@RequiredArgsConstructor

// Đóng vai trò là Factory Pattern 
public class DiscountCalculatorFactory {
    private final List<DiscountCalculator> calculators;

    public DiscountCalculator getCalculator(DiscountType discountType) { // factory method: nhận DiscountType và trả về DiscountCalculator tương ứng
        return calculators.stream()
                .filter(calculator -> calculator.supports() == discountType)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No calculator registered for " + discountType));
    }
}
