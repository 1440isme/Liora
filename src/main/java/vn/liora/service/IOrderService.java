package vn.liora.service;

import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;

import java.util.List;

public interface IOrderService {
    OrderResponse createOrder(OrderCreationRequest request);
    OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request);
    OrderResponse getOrderById(Long idOrder);
    List<OrderResponse> getMyOrders();
    List<OrderResponse> getAllOrders();
}
