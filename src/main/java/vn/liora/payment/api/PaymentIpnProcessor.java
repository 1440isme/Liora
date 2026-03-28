package vn.liora.payment.api;

import vn.liora.payment.PaymentProvider;

import java.util.Map;

public interface PaymentIpnProcessor {
    PaymentProvider provider();

    PaymentIpnResult process(Map<String, ?> params);
}

