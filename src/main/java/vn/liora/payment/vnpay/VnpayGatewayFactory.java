package vn.liora.payment.vnpay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentGatewayFactory;
import vn.liora.payment.api.PaymentIpnProcessor;
import vn.liora.payment.api.PaymentUrlCreator;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.VnpayPaymentRepository;

@Component
public class VnpayGatewayFactory implements PaymentGatewayFactory {
    private final PaymentUrlCreator urlCreator;
    private final PaymentIpnProcessor ipnProcessor;

    public VnpayGatewayFactory(
            VnpayPaymentRepository vnpayPaymentRepository,
            OrderRepository orderRepository,
            @Value("${vnpay.tmnCode}") String vnpTmnCode,
            @Value("${vnpay.hashSecret}") String vnpHashSecret,
            @Value("${vnpay.payUrl}") String vnpPayUrl,
            @Value("${vnpay.returnUrl}") String vnpReturnUrl,
            @Value("${vnpay.ipnUrl}") String vnpIpnUrl,
            @Value("${vnpay.version}") String vnpVersion,
            @Value("${vnpay.command}") String vnpCommand,
            @Value("${vnpay.currCode}") String vnpCurrCode,
            @Value("${vnpay.locale:vn}") String vnpLocale,
            @Value("${vnpay.sendIpnParam:false}") boolean vnpSendIpnParam
    ) {
        this.urlCreator = new VnpayUrlCreator(
                vnpayPaymentRepository,
                vnpTmnCode,
                vnpHashSecret,
                vnpPayUrl,
                vnpReturnUrl,
                vnpIpnUrl,
                vnpVersion,
                vnpCommand,
                vnpCurrCode,
                vnpLocale,
                vnpSendIpnParam
        );
        this.ipnProcessor = new VnpayIpnProcessor(orderRepository, vnpayPaymentRepository, vnpHashSecret);
    }

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.VNPAY;
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

