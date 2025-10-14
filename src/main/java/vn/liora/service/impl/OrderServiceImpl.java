package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
import vn.liora.entity.Discount;
import vn.liora.repository.DiscountRepository;

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

    public OrderResponse createOrder(Long userId,OrderCreationRequest request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
            Cart cart = cartRepository.findByUser(user)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
            List<CartProduct> selected = cartProductRepository.findByCartAndChooseTrue(cart);
            if (selected.isEmpty()) {
                throw new AppException(ErrorCode.NO_SELECTED_PRODUCT);
            }

            Order order = orderMapper.toOrder(request);
            Address address = addressRepository.findById(request.getIdAddress())
                    .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
            order.setAddress(address);
            order.setUser(user);
            order.setOrderDate(LocalDateTime.now());
            order.setOrderStatus("Pending");

            List<OrderProduct> orderProducts = selected.stream()
                    .map(cp -> {
                        OrderProduct op = orderProductMapper.toOrderProduct(cp);
                        op.setOrder(order);
                        return op;
                    })
                    .collect(Collectors.toList());

            BigDecimal subtotal = orderProducts.stream()
                    .map(OrderProduct::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDiscount = BigDecimal.ZERO;
            BigDecimal total = subtotal;

            if (request.getDiscountId() != null) {
                try {
                    // Kiểm tra discount có tồn tại không
                    Discount discount = discountRepository.findById(request.getDiscountId())
                            .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

                    // Kiểm tra có thể áp dụng discount không
                    if (discountService.canApplyDiscount(request.getDiscountId(), userId, subtotal)) {
                        // Tính discount amount
                        totalDiscount = discountService.calculateDiscountAmount(request.getDiscountId(), subtotal);
                        total = subtotal.subtract(totalDiscount);

                        // Set discount cho order
                        order.setDiscount(discount);

                        // Tăng usage count
                        discountService.incrementUsageCount(request.getDiscountId());

                        log.info("Applied discount {} to order. Discount amount: {}",
                                request.getDiscountId(), totalDiscount);
                    } else {
                        log.warn("Cannot apply discount {} to order. User: {}, Subtotal: {}",
                                request.getDiscountId(), userId, subtotal);
                    }
                } catch (Exception e) {
                    log.warn("Error applying discount {}: {}. Order will be created without discount.",
                            request.getDiscountId(), e.getMessage());
                    // Nếu không áp dụng được discount, vẫn tạo đơn hàng bình thường
                }
            }

            // 9. Set tổng tiền cho order
            order.setTotalDiscount(totalDiscount);
            order.setTotal(total);

            final Order savedOrder = orderRepository.save(order);
            orderProducts.forEach(op -> op.setOrder(savedOrder));
            orderProductRepository.saveAll(orderProducts);
            cartProductRepository.deleteAll(selected);
            log.info("Order created successfully. Order ID: {}, User: {}, Total: {}, Discount: {}",
                    savedOrder.getIdOrder(), userId, total, totalDiscount);

            return orderMapper.toOrderResponse(savedOrder);

        } catch (AppException e) {
            log.error("AppException in createOrder: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in createOrder: ", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Autowired
    private DiscountRepository discountRepository;

    @Autowired
    private DiscountServiceImpl discountService;

    public void applyDiscountToOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

        // Tính subtotal từ OrderProducts
        BigDecimal subTotal = calculateOrderSubTotal(order);

        // Kiểm tra có thể áp dụng discount không
        if (!discountService.canApplyDiscount(discountId, order.getUser().getUserId(), subTotal)) {
            throw new AppException(ErrorCode.DISCOUNT_CANNOT_BE_APPLIED);
        }

        // Tính discount amount
        BigDecimal discountAmount = discountService.calculateDiscountAmount(discountId, subTotal);

        // Cập nhật order
        order.setDiscount(discount);
        order.setTotalDiscount(discountAmount);
        order.setTotal(subTotal.subtract(discountAmount));

        orderRepository.save(order);

        // Tăng usage count
        discountService.incrementUsageCount(discountId);
    }

    private BigDecimal calculateOrderSubTotal(Order order) {
        List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
        return orderProducts.stream()
                .map(OrderProduct::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public void removeDiscountFromOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

        // Kiểm tra order có discount này không
        if (order.getDiscount() == null || !order.getDiscount().getDiscountId().equals(discountId)) {
            throw new AppException(ErrorCode.DISCOUNT_NOT_APPLIED_TO_ORDER);
        }

        // Tính subtotal từ OrderProducts (nhất quán với applyDiscountToOrder)
        BigDecimal subTotal = calculateOrderSubTotal(order);

        // Remove discount from order
        order.setDiscount(null);
        order.setTotalDiscount(BigDecimal.ZERO);
        order.setTotal(subTotal); // total = subtotal (không có discount)

        orderRepository.save(order);

        // Decrement usage count
        if (discount.getUsedCount() > 0) {
            discount.setUsedCount(discount.getUsedCount() - 1);
            discountRepository.save(discount);
        }
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

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
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

    @Override
    @Transactional
    public void cancelOrderByUser(Long orderId, Long userId) {
        // Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Kiểm tra xem đơn hàng có thuộc về user này không
        if (!order.getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra xem đơn hàng có thể hủy không (chỉ hủy được khi đang PENDING)
        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }

        // Cập nhật trạng thái đơn hàng thành CANCELLED
        order.setOrderStatus("CANCELLED");
        
        orderRepository.save(order);
        
        log.info("Order {} cancelled by user {}", orderId, userId);
    }
}
