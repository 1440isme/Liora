package vn.liora.service.order.state;

public interface OrderStateHandler {
    String status();

    OrderTransitionResult transition(OrderStateContext context, OrderTransitionRequest request);
}
