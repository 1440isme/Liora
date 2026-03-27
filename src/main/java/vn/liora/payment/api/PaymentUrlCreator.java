package vn.liora.payment.api;

import vn.liora.entity.Order;

public interface PaymentUrlCreator {
    String createPaymentUrl(Order order, String clientIp);
}

