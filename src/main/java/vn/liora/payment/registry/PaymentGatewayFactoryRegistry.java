package vn.liora.payment.registry;

import org.springframework.stereotype.Component;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentGatewayFactory;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentGatewayFactoryRegistry {
    private final Map<PaymentProvider, PaymentGatewayFactory> factories;

    public PaymentGatewayFactoryRegistry(List<PaymentGatewayFactory> factories) {
        Map<PaymentProvider, PaymentGatewayFactory> map = new EnumMap<>(PaymentProvider.class);
        for (PaymentGatewayFactory factory : factories) {
            map.put(factory.provider(), factory);
        }
        this.factories = Map.copyOf(map);
    }

    public PaymentGatewayFactory get(PaymentProvider provider) {
        PaymentGatewayFactory factory = factories.get(provider);
        if (factory == null) {
            throw new IllegalStateException("No PaymentGatewayFactory for provider: " + provider);
        }
        return factory;
    }
}

