package vn.liora.service.order.state;

import vn.liora.enums.OrderTransitionActor;

public record OrderTransitionRequest(
        String targetOrderStatus,
        String requestedPaymentStatus,
        OrderTransitionActor actor) {

    public static OrderTransitionRequest forAdmin(String targetOrderStatus, String requestedPaymentStatus) {
        return new OrderTransitionRequest(targetOrderStatus, requestedPaymentStatus, OrderTransitionActor.ADMIN);
    }

    public static OrderTransitionRequest forUserCancellation() {
        return new OrderTransitionRequest("CANCELLED", null, OrderTransitionActor.USER);
    }

    public String normalizedTargetOrderStatus() {
        return normalize(targetOrderStatus);
    }

    public String normalizedRequestedPaymentStatus() {
        return normalize(requestedPaymentStatus);
    }

    public boolean requestsPaymentCancellation() {
        return "CANCELLED".equals(normalizedRequestedPaymentStatus());
    }

    private static String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
