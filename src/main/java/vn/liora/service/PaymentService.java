package vn.liora.service;

import vn.liora.entity.Order;

public interface PaymentService {
    String createVnpayPaymentUrl(Order order, String clientIp);

    void handleVnpayIpn(java.util.Map<String, String> params);
}
