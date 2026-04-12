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
    public OrderTransitionResult transition(OrderStateContext context, OrderTransitionRequest request) {
        Order order = context.getOrder();
        String targetStatus = resolveTargetStatus(request);
        if (!"CANCELLED".equals(targetStatus)) {
            throw invalidTransition(request.actor());
        }

        applyRequestedPaymentStatus(order, request);
        transitionTo(context, "CANCELLED");
        return OrderTransitionResult.none();
    }
}
