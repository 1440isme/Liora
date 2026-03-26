package vn.liora.payment.api;

import vn.liora.payment.PaymentProvider;

import java.math.BigDecimal;
import java.util.Optional;

public record PaymentIpnResult(
        PaymentProvider provider,
        Long orderId,
        PaymentIpnAction action,
        Optional<BigDecimal> paidAmount,
        Optional<String> failureReason
) {
    public enum PaymentIpnAction {
        PAID,
        CANCELLED,
        FAILED,
        IGNORED
    }
}

