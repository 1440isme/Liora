package vn.liora.service.order.state;

import vn.liora.entity.Order;

import java.util.Map;

public class OrderStateContext {

    private final Order order;
    private final Map<String, OrderStateHandler> handlers;
    private OrderStateHandler currentState;

    public OrderStateContext(Order order, Map<String, OrderStateHandler> handlers, OrderStateHandler currentState) {
        this.order = order;
        this.handlers = handlers;
        this.currentState = currentState;
    }

    public Order getOrder() {
        return order;
    }

    public OrderStateHandler getCurrentState() {
        return currentState;
    }

    public OrderTransitionResult transition(OrderTransitionRequest request) {
        return currentState.transition(this, request);
    }

    public void setState(OrderStateHandler state) {
        this.currentState = state;
        if (state != null) {
            order.setOrderStatus(state.status());
        }
    }

    public void setState(String status) {
        OrderStateHandler nextState = handlers.get(normalize(status));
        if (nextState == null) {
            throw new IllegalArgumentException("Unknown order state: " + status);
        }
        setState(nextState);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
