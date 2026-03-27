package vn.liora.payment.momo;

import lombok.extern.slf4j.Slf4j;
import vn.liora.entity.MomoPayment;
import vn.liora.entity.Order;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentIpnProcessor;
import vn.liora.payment.api.PaymentIpnResult;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.repository.OrderRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
class MomoIpnProcessor implements PaymentIpnProcessor {
    private final OrderRepository orderRepository;
    private final MomoPaymentRepository momoPaymentRepository;

    MomoIpnProcessor(OrderRepository orderRepository, MomoPaymentRepository momoPaymentRepository) {
        this.orderRepository = orderRepository;
        this.momoPaymentRepository = momoPaymentRepository;
    }

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.MOMO;
    }

    @Override
    public PaymentIpnResult process(Map<String, ?> params) {
        @SuppressWarnings("unchecked")
        Map<String, Object> p = (Map<String, Object>) params;

        String orderId = (String) p.get("orderId");
        String errorCodeStr = (String) p.get("errorCode");
        Integer resultCode = errorCodeStr != null ? Integer.parseInt(errorCodeStr) : null;
        String message = (String) p.get("message");
        String transId = (String) p.get("transId");
        String orderType = (String) p.get("orderType");
        String responseTimeStr = (String) p.get("responseTime");

        Long responseTime = null;
        if (responseTimeStr != null && !responseTimeStr.isEmpty()) {
            try {
                responseTime = Long.parseLong(responseTimeStr);
            } catch (NumberFormatException e) {
                log.warn("MOMO responseTime is not a number: {}", responseTimeStr);
            }
        }

        if (orderId == null) {
            log.error("MOMO IPN missing orderId");
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        MomoPayment momoPayment = momoPaymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Order order = orderRepository.findById(momoPayment.getIdOrder())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Order {} already PAID, ignore MOMO IPN", order.getIdOrder());
            return new PaymentIpnResult(
                    PaymentProvider.MOMO,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.IGNORED,
                    Optional.empty(),
                    Optional.empty()
            );
        }

        momoPayment.setResultCode(resultCode);
        momoPayment.setMessage(message);
        momoPayment.setTransId(transId);
        momoPayment.setOrderType(orderType);
        momoPayment.setResponseTime(responseTime);

        String payUrl = (String) p.get("payUrl");
        if (payUrl != null) {
            momoPayment.setPayUrl(payUrl);
        }

        if (resultCode != null && resultCode == 0) {
            momoPayment.setPaidAmount(order.getTotal());
            momoPayment.setPaidAt(LocalDateTime.now());
            momoPayment.setFailureReason(null);
            momoPaymentRepository.save(momoPayment);

            return new PaymentIpnResult(
                    PaymentProvider.MOMO,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.PAID,
                    Optional.ofNullable(order.getTotal()),
                    Optional.empty()
            );
        }

        if (resultCode != null && (resultCode == 42 || resultCode == 24)) {
            String reason = "MOMO errorCode=" + resultCode + ", message=" + message + " (User cancelled)";
            momoPayment.setFailureReason(reason);
            momoPaymentRepository.save(momoPayment);

            return new PaymentIpnResult(
                    PaymentProvider.MOMO,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.CANCELLED,
                    Optional.empty(),
                    Optional.of(reason)
            );
        }

        String reason = "MOMO errorCode=" + resultCode + ", message=" + message;
        momoPayment.setFailureReason(reason);
        momoPaymentRepository.save(momoPayment);

        return new PaymentIpnResult(
                PaymentProvider.MOMO,
                order.getIdOrder(),
                PaymentIpnResult.PaymentIpnAction.FAILED,
                Optional.empty(),
                Optional.of(reason)
        );
    }
}

