package vn.liora.payment.api;

import vn.liora.payment.PaymentProvider;

public interface PaymentGatewayFactory {
    PaymentProvider provider();

    PaymentUrlCreator urlCreator();

    PaymentIpnProcessor ipnProcessor();
}

