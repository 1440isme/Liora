package vn.liora.service.order.state;

import org.springframework.stereotype.Component;
import vn.liora.entity.Order;

import java.util.Set;

@Component
public class CompletedOrderState extends AbstractOrderStateHandler {

    private static final Set<String> ADMIN_TARGETS = Set.of("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED");

    @Override
    public String status() {
        return "COMPLETED";
    }

    @Override
    public OrderTransitionResult transition(Order order, OrderTransitionRequest request) {
        validateAllowedTargets(request, ADMIN_TARGETS);
        applyRequestedPaymentStatus(order, request);

        String targetStatus = resolveTargetStatus(request);
        String previousPaymentStatus = normalize(order.getPaymentStatus());

        order.setOrderStatus(targetStatus);

        OrderTransitionResult.OrderTransitionResultBuilder result = OrderTransitionResult.builder();

        if ("PENDING".equals(targetStatus) || "CONFIRMED".equals(targetStatus) || "CANCELLED".equals(targetStatus)) {
            result.decreaseSoldCount(true);
        }

        if (("PENDING".equals(targetStatus) || "CONFIRMED".equals(targetStatus))
                && "REFUNDED".equals(previousPaymentStatus)) {
            order.setPaymentStatus("PAID");
        }

        if ("CONFIRMED".equals(targetStatus)) {
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
