package vn.liora.service.order.state;

import org.springframework.stereotype.Component;
import vn.liora.entity.Order;

@Component
public class CancelledOrderState extends AbstractOrderStateHandler {

    @Override
    public String status() {
        return "CANCELLED";
    }

    @Override
    public OrderTransitionResult transition(Order order, OrderTransitionRequest request) {
        String targetStatus = resolveTargetStatus(request);
        if (!"CANCELLED".equals(targetStatus)) {
            throw invalidTransition(request.actor());
        }

        applyRequestedPaymentStatus(order, request);
        order.setOrderStatus("CANCELLED");
        return OrderTransitionResult.none();
    }
}
