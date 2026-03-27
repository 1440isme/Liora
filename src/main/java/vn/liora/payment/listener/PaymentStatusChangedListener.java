package vn.liora.payment.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import vn.liora.entity.Order;
import vn.liora.payment.event.PaymentStatusChangedEvent;
import vn.liora.payment.handler.PaymentCancellationHandler;
import vn.liora.repository.OrderRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentStatusChangedListener {
    private final OrderRepository orderRepository;
    private final PaymentCancellationHandler paymentCancellationHandler;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPaymentStatusChanged(PaymentStatusChangedEvent event) {
        if (event == null || event.orderId() == null || event.action() == null) {
            return;
        }

        switch (event.action()) {
            case CANCELLED -> handleCancelled(event);
            case PAID -> handlePaid(event);
            case FAILED -> handleFailed(event);
            case IGNORED -> {
                // No-op: IGNORED được xử lý ở cấp IPN processor rồi.
            }
        }
    }

    private void handleCancelled(PaymentStatusChangedEvent event) {
        Order order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            return;
        }

        if (!"CANCELLED".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Skip cancellation side-effects for order {}: paymentStatus={}",
                    order.getIdOrder(), order.getPaymentStatus());
            return;
        }

        // Idempotency guard: only execute once per transition.
        if ("CANCELLED".equalsIgnoreCase(event.previousPaymentStatus())) {
            log.info("Skip cancellation side-effects for order {}: already CANCELLED before event",
                    order.getIdOrder());
            return;
        }

        paymentCancellationHandler.handleCancellation(order);
    }

    private void handlePaid(PaymentStatusChangedEvent event) {
        Order order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            return;
        }

        // Observer hiện tại không thêm side-effect mới cho PAID.
        // Mục tiêu chủ yếu: đảm bảo các workflow khác (ví dụ GHN COD amount)
        // đọc đúng paymentStatus đã cập nhật.
        if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Skip paid event for order {}: paymentStatus={}",
                    order.getIdOrder(), order.getPaymentStatus());
            return;
        }

        log.info("Payment marked PAID for order {}", order.getIdOrder());
    }

    private void handleFailed(PaymentStatusChangedEvent event) {
        Order order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            return;
        }

        // Observer hiện tại không thêm side-effect mới cho FAILED.
        if (!"FAILED".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Skip failed event for order {}: paymentStatus={}",
                    order.getIdOrder(), order.getPaymentStatus());
            return;
        }

        log.info("Payment marked FAILED for order {}", order.getIdOrder());
    }
}

