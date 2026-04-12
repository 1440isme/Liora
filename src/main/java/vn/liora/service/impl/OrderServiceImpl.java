package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
// removed unused imports

import java.time.LocalDate;
import java.util.ArrayList;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderItemResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.entity.*;
import vn.liora.enums.ProductItemStatus;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderItemMapper;
import vn.liora.repository.*;
import vn.liora.service.IImageService;
import vn.liora.service.IOrderService;
import vn.liora.service.IGhnShippingService;
import vn.liora.service.EmailService;
import vn.liora.service.discount.DiscountApplicationResult;
import vn.liora.service.discount.DiscountApplicationService;
import vn.liora.service.discount.DiscountContext;
import vn.liora.service.discount.DiscountUsageService;
import vn.liora.service.order.OrderSideEffectService;
import vn.liora.service.order.state.OrderStateContext;
import vn.liora.service.order.state.OrderStateContextFactory;
import vn.liora.service.order.state.OrderTransitionRequest;
import vn.liora.service.order.state.OrderTransitionResult;
import vn.liora.service.stock.ProductStockEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
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
    @SuppressWarnings("unused")
    AddressRepository addressRepository;
    OrderItemMapper orderItemMapper;
    CartItemRepository cartItemRepository;
    OrderMapper orderMapper;
    OrderItemRepository orderItemRepository;
    ProductItemRepository productItemRepository;
    IImageService imageService;
    IGhnShippingService ghnShippingService;
    EmailService emailService;
    DiscountRepository discountRepository;
    DiscountApplicationService discountApplicationService;
    DiscountUsageService discountUsageService;
    OrderStateContextFactory orderStateContextFactory;
    OrderSideEffectService orderSideEffectService;
    ProductStockEventPublisher productStockEventPublisher;

    @Override
    @Transactional
    public OrderResponse createOrder(Long idCart, OrderCreationRequest request) {
        try {
            Cart cart = cartRepository.findById(idCart)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
            User user = cart.getUser();
            List<CartItem> selected = cartItemRepository.findByCartAndChooseTrue(cart);
            if (selected.isEmpty()) {
                throw new AppException(ErrorCode.NO_SELECTED_PRODUCT);
            }

            // ✅ Lọc chỉ lấy sản phẩm hợp lệ (available=true, isActive=true, stock đủ theo
            // ProductItem)
            List<CartItem> validProducts = selected.stream()
                    .filter(cp -> {
                        Product product = cp.getProduct();
                        if (product == null) {
                            return false;
                        }
                        long availableItems = productItemRepository.countByProductProductIdAndStatus(
                                product.getProductId(),
                                ProductItemStatus.IN_STOCK);
                        return Boolean.TRUE.equals(product.getAvailable())
                                && Boolean.TRUE.equals(product.getIsActive())
                                && cp.getQuantity() != null
                                && cp.getQuantity() > 0
                                && cp.getQuantity() <= availableItems;
                    })
                    .collect(Collectors.toList());

            if (validProducts.isEmpty()) {
                throw new AppException(ErrorCode.NO_VALID_PRODUCT);
            }

            Order order = orderMapper.toOrder(request);
            order.setUser(user); // user có thể null khi guest; các thao tác phía dưới phải null-safe
            order.setOrderDate(LocalDateTime.now());
            order.setOrderStatus("PENDING");
            order.setPaymentStatus("PENDING");

            // Map địa chỉ GHN từ request (nếu FE gửi) để tính phí chuẩn
            if (request.getDistrictId() != null) {
                order.setDistrictId(request.getDistrictId());
            }
            if (request.getWardCode() != null) {
                order.setWardCode(request.getWardCode());
            }
            if (request.getProvinceId() != null) {
                order.setProvinceId(request.getProvinceId());
            }

            BigDecimal subtotal = validProducts.stream()
                    .map(CartItem::getTotalPrice)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDiscount = BigDecimal.ZERO;
            BigDecimal total = subtotal;

            if ((request.getDiscountId() != null || request.getDiscountCode() != null) && user != null) {
                try {
                    Discount discount = null;

                    // ✅ Xử lý discount theo discountCode (ưu tiên)
                    if (request.getDiscountCode() != null && !request.getDiscountCode().trim().isEmpty()) {
                        discount = discountApplicationService.findAvailableByCode(
                                request.getDiscountCode(),
                                LocalDateTime.now())
                                .orElse(null);
                        if (discount == null) {
                            log.warn("Discount code {} not found or not available", request.getDiscountCode());
                        }
                    }
                    // ✅ Fallback: xử lý theo discountId
                    else if (request.getDiscountId() != null) {
                        DiscountApplicationResult applicationResult = discountApplicationService.apply(
                                request.getDiscountId(),
                                buildDiscountContext(user.getUserId(), subtotal, BigDecimal.ZERO, order.getPaymentMethod()));
                        if (!applicationResult.isApplied()) {
                            log.warn("Cannot apply discount to order. User: {}, Subtotal: {}, Discount: {}, Reason: {}",
                                    user.getUserId(), subtotal, request.getDiscountId(), applicationResult.getFailureReason());
                        } else {
                            totalDiscount = applicationResult.getFinalDiscountAmount();
                            total = subtotal.subtract(totalDiscount);
                            order.setDiscount(applicationResult.getDiscount());
                            log.info("Applied discount {} (code: {}) to order. Discount amount: {}",
                                    applicationResult.getDiscount().getDiscountId(),
                                    applicationResult.getDiscount().getName(),
                                    totalDiscount);
                        }
                    }

                    // ✅ Áp dụng discount nếu tìm thấy
                    if (discount != null && request.getDiscountId() == null) {
                        DiscountApplicationResult applicationResult = discountApplicationService.apply(
                                discount,
                                buildDiscountContext(user.getUserId(), subtotal, BigDecimal.ZERO,
                                        order.getPaymentMethod()));
                        if (!applicationResult.isApplied()) {
                            log.warn("Cannot apply discount to order. User: {}, Subtotal: {}, Discount: {}, Reason: {}",
                                    user.getUserId(), subtotal, discount.getDiscountId(),
                                    applicationResult.getFailureReason());
                        } else {
                            totalDiscount = applicationResult.getFinalDiscountAmount();
                            total = subtotal.subtract(totalDiscount);

                            // Set discount cho order (do not increment global usedCount yet — do it after
                            // order persisted)
                            order.setDiscount(discount);

                            log.info("Applied discount {} (code: {}) to order. Discount amount: {}",
                                    discount.getDiscountId(), discount.getName(), totalDiscount);
                        }
                    } else {
                        log.warn("Cannot apply discount to order. User: {}, Subtotal: {}, Discount: {}",
                                user != null ? user.getUserId() : "Guest", subtotal, "null");
                    }
                } catch (Exception e) {
                    log.warn("Error applying discount: {}. Order will be created without discount.", e.getMessage());
                    // Nếu không áp dụng được discount, vẫn tạo đơn hàng bình thường
                }
            }

            // 9. Tính phí ship từ GHN theo combobox FE (chỉ dựa vào khoảng cách) - dùng 1
            // nơi duy nhất
            BigDecimal shippingFee = BigDecimal.ZERO;
            try {
                Integer toDistrictId = request.getDistrictId();
                String toWardCode = request.getWardCode();
                if (toDistrictId != null && toWardCode != null) {
                    shippingFee = ghnShippingService.calculateFeeByLocation(toDistrictId, toWardCode);
                }
            } catch (Exception ex) {
                log.warn("Calculate GHN fee by location failed, fallback 0: {}", ex.getMessage());
                shippingFee = BigDecimal.ZERO;
            }
            order.setShippingFee(shippingFee);

            // 10. Set tổng tiền cho order (bao gồm phí ship)
            order.setTotalDiscount(totalDiscount);
            BigDecimal computedTotal = total.add(shippingFee);
            order.setTotal(computedTotal);

            final Order savedOrder = orderRepository.save(order);
            // After order persisted, increment discount usage (if a discount was applied)
            try {
                if (savedOrder.getDiscount() != null) {
                    discountApplicationService.confirmUsage(savedOrder.getDiscount().getDiscountId());
                }
            } catch (Exception e) {
                log.warn("Failed to increment discount usage after saving order {}: {}", savedOrder.getIdOrder(),
                        e.getMessage());
            }
            reserveOrderItems(savedOrder, validProducts);

            // ✅ Chỉ xóa các sản phẩm hợp lệ đã tạo order
            cartItemRepository.deleteAll(validProducts);

            // GHN shipping order sẽ chỉ được tạo khi order status = CONFIRMED
            // để đồng bộ cho tất cả hình thức thanh toán (COD, VNPAY, MOMO)

            Long userIdLog = (user != null ? user.getUserId() : null);
            log.info("Order created successfully. Order ID: {}, User: {}, Total: {}, Discount: {}",
                    savedOrder.getIdOrder(), userIdLog, total, totalDiscount);

            // Gửi email xác nhận đơn hàng
            try {
                OrderResponse orderResponse = orderMapper.toOrderResponse(savedOrder);
                List<OrderItemResponse> orderProductResponses = getProductsByOrderId(savedOrder.getIdOrder());

                if (user != null) {
                    // User đã đăng nhập
                    emailService.sendOrderConfirmationEmail(
                            user.getEmail(),
                            user.getFirstname() + " " + user.getLastname(),
                            orderResponse,
                            orderProductResponses);
                } else {
                    // Guest user
                    emailService.sendGuestOrderConfirmationEmail(
                            request.getEmail(),
                            orderResponse,
                            orderProductResponses);
                }
            } catch (Exception e) {
                log.error("Failed to send order confirmation email: {}", e.getMessage());
                // Không throw exception để không rollback đơn hàng
            }

            return orderMapper.toOrderResponse(savedOrder);

        } catch (AppException e) {
            log.error("AppException in createOrder: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in createOrder: ", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public void applyDiscountToOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Tính subtotal từ OrderProducts
        BigDecimal subTotal = calculateOrderSubTotal(order);

        DiscountApplicationResult applicationResult = discountApplicationService.apply(
                discountId,
                buildDiscountContext(order.getUser() != null ? order.getUser().getUserId() : null,
                        subTotal,
                        order.getShippingFee(),
                        order.getPaymentMethod()));
        if (!applicationResult.isApplied()) {
            String failureReason = applicationResult.getFailureReason();
            throw new AppException(
                    ErrorCode.DISCOUNT_CANNOT_BE_APPLIED,
                    failureReason != null && !failureReason.isBlank()
                            ? failureReason
                            : ErrorCode.DISCOUNT_CANNOT_BE_APPLIED.getMessage());
        }

        BigDecimal discountAmount = applicationResult.getFinalDiscountAmount();

        // Cập nhật order
        order.setDiscount(applicationResult.getDiscount());
        order.setTotalDiscount(discountAmount);
        order.setTotal(subTotal.subtract(discountAmount));

        orderRepository.save(order);

        // Tăng usage count
        discountApplicationService.confirmUsage(discountId);
    }

    private BigDecimal calculateOrderSubTotal(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        return orderItems.stream()
                .map(oi -> oi.getProductItem().getProduct().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public void removeDiscountFromOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

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
        discountApplicationService.rollbackUsage(discountId);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long idOrder, OrderUpdateRequest request) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderStateContext stateContext = orderStateContextFactory.create(order);
        OrderTransitionResult transitionResult = stateContext.transition(
                OrderTransitionRequest.forAdmin(request.getOrderStatus(), request.getPaymentStatus()));

        order = orderRepository.save(order);
        orderSideEffectService.handleTransitionEffects(order, transitionResult);

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
    public List<OrderResponse> getMyOrdersPaginated(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, orders.size());

        if (start >= orders.size()) {
            return new ArrayList<>();
        }

        List<Order> paginatedOrders = orders.subList(start, end);
        return orderMapper.toOrderResponseList(paginatedOrders);
    }

    @Override
    public Long countMyOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return orderRepository.countByUser(user);
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByIdOrderDesc();
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
    public List<OrderItemResponse> getProductsByOrderId(Long idOrder) {
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        LinkedHashMap<Long, OrderItemResponse> grouped = new LinkedHashMap<>();
        for (OrderItem orderItem : orderItems) {
            OrderItemResponse one = orderItemMapper.toOrderItemResponse(orderItem);
            Long productId = one.getIdProduct();
            OrderItemResponse existing = grouped.get(productId);
            if (existing == null) {
                one.setMainImageUrl(imageService.findMainImageByProductId(productId)
                        .map(Image::getImageUrl)
                        .orElse(null));
                grouped.put(productId, one);
            } else {
                existing.setQuantity(existing.getQuantity() + 1);
                BigDecimal currentTotal = existing.getTotalPrice() != null ? existing.getTotalPrice() : BigDecimal.ZERO;
                BigDecimal onePrice = one.getProductPrice() != null ? one.getProductPrice() : BigDecimal.ZERO;
                existing.setTotalPrice(currentTotal.add(onePrice));
            }
        }
        return grouped.values().stream().toList();
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
    public BigDecimal getTotalRevenueByUserCompleted(User user) {
        // Tính tổng doanh thu từ các đơn hàng đã hoàn tất của một người dùng
        BigDecimal total = orderRepository.getTotalRevenueByUserCompleted(user);
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

        OrderStateContext stateContext = orderStateContextFactory.create(order);
        OrderTransitionResult transitionResult = stateContext.transition(
                OrderTransitionRequest.forUserCancellation());

        orderRepository.save(order);
        orderSideEffectService.handleTransitionEffects(order, transitionResult);

        log.info("Order {} cancelled by user {}", orderId, userId);
    }

    private void reserveOrderItems(Order order, List<CartItem> cartProducts) {
        for (CartItem cartProduct : cartProducts) {
            Product product = cartProduct.getProduct();
            int quantity = cartProduct.getQuantity();
            int previousStock = getAvailableStock(product.getProductId());
            List<ProductItem> selectedItems = productItemRepository
                    .findByProductProductIdAndStatusOrderByProductItemIdAsc(
                            product.getProductId(),
                            ProductItemStatus.IN_STOCK,
                            PageRequest.of(0, quantity));

            if (selectedItems.size() < quantity) {
                throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
            }

            for (ProductItem productItem : selectedItems) {
                productItem.setStatus(ProductItemStatus.RESERVED);
                productItem.setUpdatedDate(LocalDateTime.now());
            }
            productItemRepository.saveAll(selectedItems);

            List<OrderItem> orderItems = selectedItems.stream()
                    .map(item -> OrderItem.builder()
                            .order(order)
                            .productItem(item)
                            .createdDate(LocalDateTime.now())
                            .build())
                    .toList();
            orderItemRepository.saveAll(orderItems);

            int newStock = Math.max(0, previousStock - quantity);
            product.setStock(newStock);
            product.setAvailable(newStock > 0);
            productStockEventPublisher.publishIfNeeded(product, previousStock, newStock);
        }
    }

    private int getAvailableStock(Long productId) {
        return (int) productItemRepository.countByProductProductIdAndStatus(productId, ProductItemStatus.IN_STOCK);
    }

    private DiscountContext buildDiscountContext(Long userId, BigDecimal subtotal, BigDecimal shippingFee,
            String paymentMethod) {
        return DiscountContext.builder()
                .userId(userId)
                .orderSubtotal(subtotal)
                .shippingFee(shippingFee)
                .paymentMethod(paymentMethod)
                .appliedAt(LocalDateTime.now())
                .build();
    }

    private void rollbackDiscountUsage(Discount discount, String reason) {
        discountApplicationService.rollbackUsage(discount);
        log.info("Rolled back discount usage for discount {} ({})", discount.getDiscountId(), reason);
    }

    @Override
    public BigDecimal getRevenueByDate(LocalDate date) {
        // Tính tổng doanh thu trong ngày
        LocalDateTime startOfDay = date.atStartOfDay();
        BigDecimal total = orderRepository.getRevenueByDate(startOfDay);
        return total != null ? total : BigDecimal.ZERO;
    }

    // tổng doanh thu của đơn hàng đã hoàn thành
    @Override
    public BigDecimal getTotalRevenueCompleted() {
        BigDecimal total = orderRepository.getTotalRevenueCompleted();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<Order> getRecentOrders(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "orderDate"));
        return orderRepository.findAll(pageable).getContent();
    }

    // ======================== DOANH THU THEO SẢN PHẨM ========================
    @Override
    public BigDecimal getRevenueByProductId(Long productId) {
        return orderRepository.getRevenueByProductId(productId);
    }

    @Override
    public List<Object[]> getRevenueByDay(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByDay(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByMonth(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByMonth(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByYear(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.getRevenueByYear(startDate, endDate);
    }

    @Override
    public long countReturningCustomers() {
        return orderRepository.countReturningCustomers();
    }

    @Override
    public long countCustomersWithCompletedOrders() {
        return orderRepository.countCustomersWithCompletedOrders();
    }

    @Override
    public List<TopCustomerResponse> getTopSpenders(int limit) {
        return orderRepository.findTopSpenders(PageRequest.of(0, limit));
    }

    public Long count() {
        return orderRepository.count();
    }

}
