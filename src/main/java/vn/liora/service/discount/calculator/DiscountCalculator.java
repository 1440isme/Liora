package vn.liora.service.discount.calculator;

import vn.liora.entity.Discount;
import vn.liora.enums.DiscountType;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;

public interface DiscountCalculator {
    DiscountType supports();

    BigDecimal calculate(Discount discount, DiscountContext context);
}
