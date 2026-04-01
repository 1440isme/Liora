package vn.liora.service.order.state;

import vn.liora.entity.Order;

public interface OrderStateHandler {
    String status();

    OrderTransitionResult transition(Order order, OrderTransitionRequest request);
}
