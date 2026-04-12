package vn.liora.service.order.state;

import vn.liora.entity.Order;
import vn.liora.enums.OrderTransitionActor;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;

import java.util.Set;

public abstract class AbstractOrderStateHandler implements OrderStateHandler {

    protected void transitionTo(OrderStateContext context, String targetStatus) {
        context.setState(targetStatus);
    }

    protected void validateAllowedTargets(OrderTransitionRequest request, Set<String> allowedTargets) {
        String targetStatus = resolveTargetStatus(request);
        if (targetStatus == null || !allowedTargets.contains(targetStatus)) {
            throw invalidTransition(request.actor());
        }
    }

    protected String resolveTargetStatus(OrderTransitionRequest request) {
        if (request.requestsPaymentCancellation()) {
            return "CANCELLED";
        }
        return request.normalizedTargetOrderStatus();
    }

    protected void applyRequestedPaymentStatus(Order order, OrderTransitionRequest request) {
        String requestedPaymentStatus = request.normalizedRequestedPaymentStatus();
        if (requestedPaymentStatus != null) {
            order.setPaymentStatus(requestedPaymentStatus);
        }
    }

    protected AppException invalidTransition(OrderTransitionActor actor) {
        if (actor == OrderTransitionActor.USER) {
            return new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }
        return new AppException(ErrorCode.INVALID_ORDER_STATUS);
    }
}
