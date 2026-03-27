package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Order;
import vn.liora.entity.MomoPayment;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentIpnResult;
import vn.liora.payment.event.PaymentStatusChangedEvent;
import vn.liora.payment.registry.PaymentGatewayFactoryRegistry;
import vn.liora.service.PaymentService;

import java.util.*;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = false)
public class PaymentServiceImpl implements PaymentService {

    final OrderRepository orderRepository;
    final MomoPaymentRepository momoPaymentRepository;
    final PaymentGatewayFactoryRegistry paymentGatewayFactoryRegistry;
    final ApplicationEventPublisher eventPublisher;

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

        String previousPaymentStatus = order.getPaymentStatus();
        String previousOrderStatus = order.getOrderStatus();

        switch (result.action()) {
            case PAID -> order.setPaymentStatus("PAID");
            case FAILED -> order.setPaymentStatus("FAILED");
            case CANCELLED -> {
                order.setPaymentStatus("CANCELLED");
                order.setOrderStatus("CANCELLED");
            }
            default -> {
            }
        }

        orderRepository.save(order);

        String newPaymentStatus = order.getPaymentStatus();
        boolean paymentStatusChanged = !Objects.equals(
                normalizeStatus(previousPaymentStatus),
                normalizeStatus(newPaymentStatus)
        );

        if (paymentStatusChanged) {
            eventPublisher.publishEvent(new PaymentStatusChangedEvent(
                    result.provider(),
                    order.getIdOrder(),
                    result.action(),
                    previousPaymentStatus,
                    newPaymentStatus,
                    result.paidAmount(),
                    result.failureReason(),
                    Instant.now()
            ));
        } else {
            if (log.isInfoEnabled()) {
                log.info("Skip publishing PaymentStatusChangedEvent for order {} (no paymentStatus change). action={}, prevPaymentStatus={}, newPaymentStatus={}, prevOrderStatus={}, newOrderStatus={}",
                        order.getIdOrder(),
                        result.action(),
                        previousPaymentStatus,
                        newPaymentStatus,
                        previousOrderStatus,
                        order.getOrderStatus()
                );
            }
        }
    }

    private static String normalizeStatus(String status) {
        return status == null ? null : status.trim().toUpperCase(Locale.ROOT);
    }

    @Override
    public Optional<MomoPayment> findMomoPaymentByOrderId(String orderId) {
        return momoPaymentRepository.findByOrderId(orderId);
    }

}
