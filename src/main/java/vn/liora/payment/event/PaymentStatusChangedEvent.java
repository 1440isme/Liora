package vn.liora.payment.event;

import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentIpnResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

public record PaymentStatusChangedEvent(
        PaymentProvider provider,
        Long orderId,
        PaymentIpnResult.PaymentIpnAction action,
        String previousPaymentStatus,
        String newPaymentStatus,
        Optional<BigDecimal> paidAmount,
        Optional<String> failureReason,
        Instant occurredAt
) {
}

