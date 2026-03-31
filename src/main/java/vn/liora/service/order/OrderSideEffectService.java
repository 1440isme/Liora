package vn.liora.service.order;

import vn.liora.entity.Order;
import vn.liora.service.order.state.OrderTransitionResult;

public interface OrderSideEffectService {
    void handleTransitionEffects(Order order, OrderTransitionResult result);

    void rollbackDiscountUsage(Order order);

    void restoreStock(Order order);

    void increaseSoldCount(Order order);

    void decreaseSoldCount(Order order);

    void ensureShippingOrderCreated(Order order);

    void sendCancellationEmail(Order order);
}
