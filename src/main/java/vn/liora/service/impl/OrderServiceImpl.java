package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Order;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.OrderMapper;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderServiceImpl implements IOrderService {

    OrderRepository orderRepository;
    UserRepository userRepository;
    OrderMapper orderMapper;

    @Override
    public OrderResponse createOrder(OrderCreationRequest request) {
        String userCurent = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(userCurent))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Order order = orderMapper.toOrder(request);
        order.setUser(user);

        order = orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        orderMapper.updateOrder(order, request);
        order = orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }


    @Override
    public OrderResponse getOrderById(Long idOrder) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!order.getUser().getUserId().toString().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getMyOrders() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findByUser(user);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orderMapper.toOrderResponseList(orders);
    }


}
