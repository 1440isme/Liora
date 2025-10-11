package vn.liora.service;

import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface IOrderService {
    OrderResponse createOrder(Long idCart, OrderCreationRequest request);
    OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request);
    OrderResponse getOrderById(Long idOrder);
    List<OrderResponse> getMyOrders(Long userId);
    List<OrderResponse> getAllOrders();
    List<OrderResponse> getOrdersByOrderStatus(String orderStatus);
    List<OrderResponse> getOrdersByDateRange(LocalDateTime start, LocalDateTime end);
    Long countByUser(User user);
    BigDecimal getTotalRevenue();
    BigDecimal getTotalRevenueByUser(User user);
}
