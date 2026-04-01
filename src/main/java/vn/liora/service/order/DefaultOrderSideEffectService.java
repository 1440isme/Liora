package vn.liora.service.order;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.OrderItemResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Discount;
import vn.liora.entity.Order;
import vn.liora.entity.OrderItem;
import vn.liora.entity.Product;
import vn.liora.entity.ProductItem;
import vn.liora.enums.ProductItemStatus;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderItemMapper;
import vn.liora.repository.GhnShippingRepository;
import vn.liora.repository.OrderItemRepository;
import vn.liora.repository.ProductItemRepository;
import vn.liora.service.EmailService;
import vn.liora.service.IGhnShippingService;
import vn.liora.service.IProductService;
import vn.liora.service.discount.DiscountUsageService;
import vn.liora.service.order.state.OrderTransitionResult;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DefaultOrderSideEffectService implements OrderSideEffectService {

    private final OrderItemRepository orderItemRepository;
    private final ProductItemRepository productItemRepository;
    private final IProductService productService;
    private final EmailService emailService;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final DiscountUsageService discountUsageService;
    private final IGhnShippingService ghnShippingService;
    private final GhnShippingRepository ghnShippingRepository;

    @Override
    public void handleTransitionEffects(Order order, OrderTransitionResult result) {
        if (result.shouldRollbackDiscount()) {
            rollbackDiscountUsage(order);
        }
        if (result.shouldRestoreStock()) {
            restoreStock(order);
        }
        if (result.shouldIncreaseSoldCount()) {
            increaseSoldCount(order);
        }
        if (result.shouldDecreaseSoldCount()) {
            decreaseSoldCount(order);
        }
        if (result.shouldCreateShippingOrder()) {
            ensureShippingOrderCreated(order);
        }
        if (result.shouldSendCancellationEmail()) {
            sendCancellationEmail(order);
        }
    }

    @Override
    public void rollbackDiscountUsage(Order order) {
        if (order == null) {
            return;
        }

        Discount discount = order.getDiscount();
        if (discount == null) {
            return;
        }

        try {
            discountUsageService.rollbackUsage(discount);
            log.info("Rolled back discount usage for order {}", order.getIdOrder());
        } catch (Exception e) {
            log.warn("Failed to rollback discount usage for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    @Override
    public void restoreStock(Order order) {
        try {
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
            for (OrderItem orderItem : orderItems) {
                ProductItem productItem = orderItem.getProductItem();
                productItem.setStatus(ProductItemStatus.IN_STOCK);
                productItem.setUpdatedDate(java.time.LocalDateTime.now());
            }
            productItemRepository.saveAll(orderItems.stream().map(OrderItem::getProductItem).toList());
            log.info("Restored {} product items for order {}", orderItems.size(), order.getIdOrder());
        } catch (Exception e) {
            log.error("Error restoring stock for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    @Override
    public void increaseSoldCount(Order order) {
        updateSoldCount(order, true);
    }

    @Override
    public void decreaseSoldCount(Order order) {
        updateSoldCount(order, false);
    }

    @Override
    public void ensureShippingOrderCreated(Order order) {
        try {
            if (ghnShippingRepository.findByIdOrder(order.getIdOrder()).isPresent()) {
                log.info("GHN shipping order already exists for Order {}", order.getIdOrder());
                return;
            }

            if (order.getDistrictId() == null || order.getWardCode() == null) {
                log.warn("Skip GHN create for Order {}: missing district/ward.", order.getIdOrder());
                return;
            }

            ghnShippingService.createShippingOrder(order);
            log.info("Created GHN shipping order for Order {}", order.getIdOrder());
        } catch (Exception e) {
            log.error("Failed to create GHN order for Order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    @Override
    public void sendCancellationEmail(Order order) {
        try {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);
            List<OrderItemResponse> orderProductResponses = orderItemRepository.findByOrder(order).stream()
                    .map(orderItemMapper::toOrderItemResponse)
                    .collect(Collectors.toList());

            if (order.getUser() != null) {
                emailService.sendOrderCancellationEmail(
                        order.getUser().getEmail(),
                        order.getUser().getFirstname() + " " + order.getUser().getLastname(),
                        orderResponse,
                        orderProductResponses);
            } else {
                emailService.sendGuestOrderCancellationEmail(
                        order.getEmail(),
                        orderResponse,
                        orderProductResponses);
            }
        } catch (Exception e) {
            log.error("Failed to send cancellation email for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }

    private void updateSoldCount(Order order, boolean increase) {
        try {
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
            for (OrderItem orderItem : orderItems) {
                ProductItem productItem = orderItem.getProductItem();
                productItem.setStatus(increase ? ProductItemStatus.SOLD : ProductItemStatus.RESERVED);
                productItem.setUpdatedDate(LocalDateTime.now());
            }
            if (!orderItems.isEmpty()) {
                productItemRepository.saveAll(orderItems.stream().map(OrderItem::getProductItem).toList());
            }
            LinkedHashMap<Long, Integer> quantityByProduct = new LinkedHashMap<>();
            for (OrderItem orderItem : orderItems) {
                Product product = orderItem.getProductItem().getProduct();
                quantityByProduct.merge(product.getProductId(), 1, Integer::sum);
            }
            for (var entry : quantityByProduct.entrySet()) {
                Long productId = entry.getKey();
                Integer quantity = entry.getValue();
                try {
                    Product product = productService.findByIdOptional(productId).orElse(null);
                    if (product == null) {
                        continue;
                    }
                    Integer currentSoldCount = product.getSoldCount() != null ? product.getSoldCount() : 0;
                    Integer newSoldCount = increase
                            ? currentSoldCount + quantity
                            : Math.max(0, currentSoldCount - quantity);
                    productService.updateSoldCount(productId, newSoldCount);
                    log.info("Updated sold count for product {}: {} -> {} (quantity: {}, increase: {})",
                            productId, currentSoldCount, newSoldCount, quantity, increase);
                } catch (Exception e) {
                    log.error("Error updating sold count for product {}: {}", productId, e.getMessage());
                }
            }
            if (!orderItems.isEmpty()) {
                log.info("Updated {} product item statuses for order {} (increase: {})",
                        orderItems.size(), order.getIdOrder(), increase);
            }
        } catch (Exception e) {
            log.error("Error updating sold count for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }
}
