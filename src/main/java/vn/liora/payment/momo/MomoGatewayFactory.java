package vn.liora.payment.momo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentGatewayFactory;
import vn.liora.payment.api.PaymentIpnProcessor;
import vn.liora.payment.api.PaymentUrlCreator;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.repository.OrderRepository;

@Component
public class MomoGatewayFactory implements PaymentGatewayFactory {
    private final PaymentUrlCreator urlCreator;
    private final PaymentIpnProcessor ipnProcessor;

    public MomoGatewayFactory(
            MomoPaymentRepository momoPaymentRepository,
            OrderRepository orderRepository,
            RestTemplate restTemplate,
            @Value("${momo.partnerCode}") String momoPartnerCode,
            @Value("${momo.accessKey}") String momoAccessKey,
            @Value("${momo.secretKey}") String momoSecretKey,
            @Value("${momo.api.endpoint}") String momoApiEndpoint,
            @Value("${momo.returnUrl}") String momoReturnUrl,
            @Value("${momo.notifyUrl}") String momoIpnUrl,
            @Value("${momo.requestType}") String momoRequestType
    ) {
        this.urlCreator = new MomoUrlCreator(
                momoPaymentRepository,
                restTemplate,
                momoPartnerCode,
                momoAccessKey,
                momoSecretKey,
                momoApiEndpoint,
                momoReturnUrl,
                momoIpnUrl,
                momoRequestType
        );
        this.ipnProcessor = new MomoIpnProcessor(orderRepository, momoPaymentRepository);
    }

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.MOMO;
    }

    @Override
    public PaymentUrlCreator urlCreator() {
        return urlCreator;
    }

    @Override
    public PaymentIpnProcessor ipnProcessor() {
        return ipnProcessor;
    }
}

