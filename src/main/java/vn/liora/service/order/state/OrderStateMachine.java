package vn.liora.service.order.state;

import org.springframework.stereotype.Component;
import vn.liora.entity.Order;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OrderStateMachine {

    private final Map<String, OrderStateHandler> handlers;

    public OrderStateMachine(List<OrderStateHandler> handlers) {
        this.handlers = handlers.stream()
                .collect(Collectors.toMap(OrderStateHandler::status, Function.identity()));
    }

    public OrderTransitionResult transition(Order order, OrderTransitionRequest request) {
        String currentStatus = normalize(order.getOrderStatus());
        OrderStateHandler handler = handlers.get(currentStatus);
        if (handler == null) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }
        return handler.transition(order, request);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
