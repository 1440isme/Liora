package vn.liora.service.Authen;

import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class AuthenticationStrategyFactory {

    private final Map<String, LoginStrategy> strategies;

    public AuthenticationStrategyFactory(Map<String, LoginStrategy> strategies) {
        this.strategies = strategies;
    }

    public LoginStrategy getStrategy(String provider) {
        LoginStrategy strategy = strategies.get(provider.toUpperCase());
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported login provider: " + provider);
        }
        return strategy;
    }
}
