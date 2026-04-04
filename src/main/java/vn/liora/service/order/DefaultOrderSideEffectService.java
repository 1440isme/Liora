package vn.liora.service.order;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Discount;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.Product;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.GhnShippingRepository;
import vn.liora.repository.OrderProductRepository;
import vn.liora.service.EmailService;
import vn.liora.service.IGhnShippingService;
import vn.liora.service.IProductService;
import vn.liora.service.discount.DiscountUsageService;
import vn.liora.service.order.state.OrderTransitionResult;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DefaultOrderSideEffectService implements OrderSideEffectService {

    private final OrderProductRepository orderProductRepository;
    private final IProductService productService;
    private final EmailService emailService;
    private final OrderMapper orderMapper;
    private final OrderProductMapper orderProductMapper;
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
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            for (OrderProduct orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentStock = product.getStock();
                    Integer quantity = orderProduct.getQuantity();
                    Integer newStock = currentStock + quantity;

                    productService.updateStock(product.getProductId(), newStock);

                    log.info("Restored stock for product {}: {} -> {} (quantity: {})",
                            product.getProductId(), currentStock, newStock, quantity);
                } catch (Exception e) {
                    log.error("Error restoring stock for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                }
            }
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
            List<OrderProductResponse> orderProductResponses = orderProductRepository.findByOrder(order).stream()
                    .map(orderProductMapper::toOrderProductResponse)
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
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            for (OrderProduct orderProduct : orderProducts) {
                try {
                    Product product = orderProduct.getProduct();
                    Integer currentSoldCount = product.getSoldCount();
                    if (currentSoldCount == null) {
                        currentSoldCount = 0;
                    }
                    Integer quantity = orderProduct.getQuantity();
                    Integer newSoldCount = increase
                            ? currentSoldCount + quantity
                            : Math.max(0, currentSoldCount - quantity);

                    productService.updateSoldCount(product.getProductId(), newSoldCount);

                    log.info("Updated sold count for product {}: {} -> {} (quantity: {}, increase: {})",
                            product.getProductId(), currentSoldCount, newSoldCount, quantity, increase);
                } catch (Exception e) {
                    log.error("Error updating sold count for product {}: {}",
                            orderProduct.getProduct().getProductId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error updating sold count for order {}: {}", order.getIdOrder(), e.getMessage());
        }
    }
}
