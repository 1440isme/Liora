package vn.liora.Authen;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.liora.entity.User;
import vn.liora.enums.AuthProvider;

import java.util.Map;

/**
 * Lớp đóng vai trò CONTEXT trong Strategy Pattern theo đúng Core Module Design.
 */
@Service
@RequiredArgsConstructor
public class OAuth2AuthenticationService {

    private final AuthenticationStrategyFactory factory;

    /**
     * +login(AuthProvider provider, Map attributes) User
     */
    public User login(AuthProvider provider, Map<String, Object> attributes) {
        LoginStrategy strategy = factory.getStrategy(provider);
        return strategy.login(attributes);
    }
}
