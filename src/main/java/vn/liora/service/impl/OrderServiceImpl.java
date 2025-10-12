package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.*;
import vn.liora.service.IImageService;
import vn.liora.service.IOrderService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderServiceImpl implements IOrderService {

    OrderRepository orderRepository;
    UserRepository userRepository;
    CartRepository cartRepository;
    AddressRepository addressRepository;
    OrderProductRepository orderProductRepository;
    OrderProductMapper orderProductMapper;
    CartProductRepository cartProductRepository;
    OrderMapper orderMapper;
    IImageService imageService;

    @Override
    @Transactional
    public OrderResponse createOrder(Long idCart, OrderCreationRequest request) {
        Cart cart = cartRepository.findById(idCart)
            .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        User user = cart.getUser();
        List<CartProduct> selected = cartProductRepository.findByCartAndChooseTrue(cart);
        if (selected.isEmpty())
            throw new AppException(ErrorCode.NO_SELECTED_PRODUCT);

        Order order = orderMapper.toOrder(request);
        Address address = addressRepository.findById(request.getIdAddress())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        order.setAddress(address);
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus("Pending");
        order.setTotalDiscount(new BigDecimal("10000"));
        order.setTotal(new BigDecimal("0"));
         final Order savedOrder = orderRepository.save(order);

        List<OrderProduct> orderProducts = selected.stream()
                .map(cp -> {
                    OrderProduct op = orderProductMapper.toOrderProduct(cp);
                    op.setOrder(savedOrder);
                    return op;
                })
                .collect(Collectors.toList());

        BigDecimal subtotal = orderProducts.stream()
                .map(OrderProduct::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = subtotal
                .subtract(order.getTotalDiscount());
        order.setTotal(total);

        order = orderRepository.save(order);
        orderProductRepository.saveAll(orderProducts);
        cartProductRepository.deleteAll(selected);
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

        return orderMapper.toOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getMyOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findByUser(user);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getOrdersByOrderStatus(String orderStatus) {
        List<Order> orders = orderRepository.findByOrderStatus(orderStatus);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderResponse> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        // Lấy danh sách đơn hàng theo khoảng thời gian
        List<Order> orders = orderRepository.findByOrderDateBetween(start, end);
        return orderMapper.toOrderResponseList(orders);
    }

    @Override
    public List<OrderProductResponse> getProductsByOrderId(Long idOrder) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
        List<OrderProductResponse> responses = orderProducts.stream().map(op -> {
            OrderProductResponse resp = orderProductMapper.toOrderProductResponse(op);
            String mainImageUrl = imageService.findMainImageByProductId(op.getProduct().getProductId())
                    .map(Image::getImageUrl)
                    .orElse(null);
            resp.setMainImageUrl(mainImageUrl);
            return resp;
        }).collect(Collectors.toList());
        return responses;
    }

    @Override
    public Long countByUser(User user) {
        // Đếm tổng số đơn hàng của một người dùng
        return orderRepository.countByUser(user);
    }

    @Override
    public BigDecimal getTotalRevenue() {
        // Tính tổng doanh thu từ tất cả các đơn hàng
        BigDecimal total = orderRepository.getTotalRevenue();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getTotalRevenueByUser(User user) {
        // Tính tổng doanh thu từ các đơn hàng của một người dùng
        BigDecimal total = orderRepository.getTotalRevenueByUser(user);
        return total != null ? total : BigDecimal.ZERO;
    }
}
