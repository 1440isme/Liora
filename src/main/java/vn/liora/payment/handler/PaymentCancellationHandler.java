package vn.liora.payment.handler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.Product;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.OrderProductRepository;
import vn.liora.service.EmailService;
import vn.liora.service.IProductService;
import vn.liora.service.discount.DiscountApplicationService;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentCancellationHandler {
    private final OrderProductRepository orderProductRepository;
    private final IProductService productService;
    private final EmailService emailService;
    private final OrderMapper orderMapper;
    private final OrderProductMapper orderProductMapper;
    private final DiscountApplicationService discountApplicationService;

    public void handleCancellation(Order order) {
        rollbackDiscountIfAny(order);
        restoreStockForOrder(order);
        sendCancellationEmail(order);
    }

    private void rollbackDiscountIfAny(Order order) {
        if (order == null || order.getDiscount() == null) {
            return;
        }
        try {
            discountApplicationService.rollbackUsage(order.getDiscount());
            log.info("Rolled back discount usage for order {} (payment cancelled)", order.getIdOrder());
        } catch (Exception e) {
            log.warn("Failed to rollback discount for cancelled payment: {}", e.getMessage());
        }
    }

    private void restoreStockForOrder(Order order) {
        try {
            var orderProducts = orderProductRepository.findByOrder(order);
            for (var orderProduct : orderProducts) {
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

    private void sendCancellationEmail(Order order) {
        try {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                    .map(orderProductMapper::toOrderProductResponse)
                    .collect(java.util.stream.Collectors.toList());

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
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }
}
