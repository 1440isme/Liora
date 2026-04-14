package vn.liora.service.order.state;

import org.springframework.stereotype.Component;
import vn.liora.entity.Order;
import vn.liora.enums.OrderTransitionActor;

import java.util.Set;

@Component
public class PendingOrderState extends AbstractOrderStateHandler {

    private static final Set<String> ADMIN_TARGETS = Set.of("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED");
    private static final Set<String> USER_TARGETS = Set.of("CANCELLED");

    @Override
    public String status() {
        return "PENDING";
    }

    @Override
    public OrderTransitionResult transition(OrderStateContext context, OrderTransitionRequest request) {
        Order order = context.getOrder();
        validateAllowedTargets(request, request.actor() == OrderTransitionActor.USER ? USER_TARGETS : ADMIN_TARGETS);
        applyRequestedPaymentStatus(order, request);

        String targetStatus = resolveTargetStatus(request);
        String previousPaymentStatus = normalize(order.getPaymentStatus());

        transitionTo(context, targetStatus);

        OrderTransitionResult.OrderTransitionResultBuilder result = OrderTransitionResult.builder();

        if ("COMPLETED".equals(targetStatus) && !"COMPLETED".equals(status())) {
            if ("PENDING".equals(previousPaymentStatus)) {
                order.setPaymentStatus("PAID");
            }
            result.increaseSoldCount(true);
        }

        if ("CONFIRMED".equals(targetStatus) && !"CONFIRMED".equals(status())) {
            result.createShippingOrder(true);
        }

        if ("CANCELLED".equals(targetStatus)) {
            if ("PAID".equals(previousPaymentStatus)) {
                order.setPaymentStatus("REFUNDED");
            }
            result.rollbackDiscount(true)
                    .restoreStock(true)
                    .sendCancellationEmail(true);
        }

        return result.build();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
