package vn.liora.service.discount;

import lombok.Builder;
import lombok.Value;
import vn.liora.entity.Discount;

import java.math.BigDecimal;

@Value
@Builder

// Factory method pattern: trả về DiscountApplicationResult (ko phải lặp builder nhiều nơi, đảm bảo format)
//Nó trả lời cùng lúc 3 câu hỏi:
// 1. Mã giảm giá có áp được không? -> applied
// 2. Nếu áp được thì giảm bao nhiêu tiền? -> discountAmount, shippingDiscountAmount, finalDiscountAmount
// 3. Nếu không áp được thì vì sao thất bại? -> failureReason

public class DiscountApplicationResult {
    boolean applied;
    Discount discount;
    BigDecimal discountAmount;
    BigDecimal shippingDiscountAmount;
    BigDecimal finalDiscountAmount;
    String failureReason;

    public static DiscountApplicationResult rejected(Discount discount, String failureReason) {
        return DiscountApplicationResult.builder()
                .applied(false)
                .discount(discount)
                .discountAmount(BigDecimal.ZERO) // số tiền giảm chính
                .shippingDiscountAmount(BigDecimal.ZERO) // số tiền giảm ở phần ship
                .finalDiscountAmount(BigDecimal.ZERO) // tổng mức giảm cuối cùng mà hệ thống dùng
                .failureReason(failureReason)
                .build();
    }
}
