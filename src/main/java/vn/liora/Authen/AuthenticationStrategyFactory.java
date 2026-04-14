package vn.liora.Authen;

import org.springframework.stereotype.Component;
import vn.liora.enums.AuthProvider;
import java.util.List;
import java.util.EnumMap;
import java.util.Map;

@Component
public class AuthenticationStrategyFactory {

    private final Map<AuthProvider, LoginStrategy> strategies;

    public AuthenticationStrategyFactory(List<LoginStrategy> strategyList) {
        strategies = new EnumMap<>(AuthProvider.class);
        strategyList.forEach(strategy -> strategies.put(strategy.getProvider(), strategy));
    }

    public LoginStrategy getStrategy(AuthProvider provider) {
        LoginStrategy strategy = strategies.get(provider);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported login provider: " + provider);
        }
        return strategy;
    }
}
