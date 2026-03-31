package vn.liora.payment.handler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.liora.entity.Order;
import vn.liora.service.order.OrderSideEffectService;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentCancellationHandler {
    private final OrderSideEffectService orderSideEffectService;

    public void handleCancellation(Order order) {
        orderSideEffectService.rollbackDiscountUsage(order);
        orderSideEffectService.restoreStock(order);
        orderSideEffectService.sendCancellationEmail(order);
    }
}
