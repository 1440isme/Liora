package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Order;
import vn.liora.entity.MomoPayment;
import vn.liora.entity.Discount;
import vn.liora.entity.Product;
import vn.liora.entity.OrderProduct;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.DiscountRepository;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentIpnResult;
import vn.liora.payment.registry.PaymentGatewayFactoryRegistry;
import vn.liora.service.PaymentService;
import vn.liora.service.IProductService;
import vn.liora.service.EmailService;

import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = false)
public class PaymentServiceImpl implements PaymentService {

    final OrderRepository orderRepository;
    final MomoPaymentRepository momoPaymentRepository;
    final OrderProductRepository orderProductRepository;
    final IProductService productService;
    final DiscountRepository discountRepository;
    final EmailService emailService;
    final OrderMapper orderMapper;
    final OrderProductMapper orderProductMapper;
    final PaymentGatewayFactoryRegistry paymentGatewayFactoryRegistry;

    @Override
    public String createVnpayPaymentUrl(Order order, String clientIp) {
        return paymentGatewayFactoryRegistry
                .get(PaymentProvider.VNPAY)
                .urlCreator()
                .createPaymentUrl(order, clientIp);
    }

    @Override
    @Transactional
    public void handleVnpayIpn(Map<String, String> params) {
        PaymentIpnResult result = paymentGatewayFactoryRegistry
                .get(PaymentProvider.VNPAY)
                .ipnProcessor()
                .process(params);
        applyIpnResult(result);
    }

    @Override
    public String createMomoPaymentUrl(Order order, String clientIp) {
        return paymentGatewayFactoryRegistry
                .get(PaymentProvider.MOMO)
                .urlCreator()
                .createPaymentUrl(order, clientIp);
    }

    @Override
    @Transactional
    public void handleMomoIpn(Map<String, Object> params) {
        try {
            PaymentIpnResult result = paymentGatewayFactoryRegistry
                    .get(PaymentProvider.MOMO)
                    .ipnProcessor()
                    .process(params);
            applyIpnResult(result);

        } catch (Exception e) {
            log.error("Error processing MOMO IPN", e);
            throw e;
        }
    }

    private void applyIpnResult(PaymentIpnResult result) {
        if (result == null || result.orderId() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        if (result.action() == PaymentIpnResult.PaymentIpnAction.IGNORED) {
            return;
        }

        Order order = orderRepository.findById(result.orderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        switch (result.action()) {
            case PAID -> order.setPaymentStatus("PAID");
            case FAILED -> order.setPaymentStatus("FAILED");
            case CANCELLED -> {
                order.setPaymentStatus("CANCELLED");
                order.setOrderStatus("CANCELLED");
                rollbackDiscountIfAny(order);
                try {
                    restoreStockForOrder(order);
                } catch (Exception e) {
                    log.warn("Failed to restore stock for cancelled payment: {}", e.getMessage());
                }
                try {
                    sendCancellationEmail(order);
                } catch (Exception e) {
                    log.warn("Failed to send cancellation email: {}", e.getMessage());
                }
            }
            default -> {
            }
        }

        orderRepository.save(order);
    }

    private void rollbackDiscountIfAny(Order order) {
        if (order == null || order.getDiscount() == null) {
            return;
        }
        try {
            Discount discount = order.getDiscount();
            if (discount.getUsedCount() > 0) {
                discount.setUsedCount(discount.getUsedCount() - 1);
                discountRepository.save(discount);
                log.info("Rolled back discount usage for order {} (payment cancelled)", order.getIdOrder());
            }
        } catch (Exception e) {
            log.warn("Failed to rollback discount for cancelled payment: {}", e.getMessage());
        }
    }

    /**
     * Gửi email thông báo hủy đơn hàng
     */
    private void sendCancellationEmail(Order order) {
        try {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            List<OrderProductResponse> orderProductResponses = orderProducts.stream()
                    .map(orderProductMapper::toOrderProductResponse)
                    .collect(java.util.stream.Collectors.toList());

            if (order.getUser() != null) {
                // User đã đăng nhập
                emailService.sendOrderCancellationEmail(
                        order.getUser().getEmail(),
                        order.getUser().getFirstname() + " " + order.getUser().getLastname(),
                        orderResponse,
                        orderProductResponses);
            } else {
                // Guest user
                emailService.sendGuestOrderCancellationEmail(
                        order.getEmail(),
                        orderResponse,
                        orderProductResponses);
            }
        } catch (Exception e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }

    /**
     * Hoàn lại stock cho các sản phẩm trong đơn hàng bị hủy
     */
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

    @Override
    public Optional<MomoPayment> findMomoPaymentByOrderId(String orderId) {
        return momoPaymentRepository.findByOrderId(orderId);
    }

}
