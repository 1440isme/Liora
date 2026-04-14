package vn.liora.service.discount.calculator;

import vn.liora.entity.Discount;
import vn.liora.enums.DiscountType;
import vn.liora.service.discount.DiscountContext;

import java.math.BigDecimal;

// Đóng vai trò là Strategy interface

public interface DiscountCalculator {
    DiscountType supports(); // cho biết strategy này xử lý loại discount nào

    BigDecimal calculate(Discount discount, DiscountContext context); // chứa thuật toán tính giảm giá tương ứng
}
