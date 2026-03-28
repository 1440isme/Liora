package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import vn.liora.dto.CustomOAuth2User;
import vn.liora.entity.User;
import vn.liora.service.Authen.AuthenticationStrategyFactory;
import vn.liora.service.Authen.LoginStrategy;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final AuthenticationStrategyFactory factory;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        // Lấy provider tương ứng (VD: GOOGLE)
        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();

        // Sử dụng Strategy tương ứng để lấy hoặc tạo User
        LoginStrategy strategy = factory.getStrategy(provider);
        User user = strategy.login(oauth2User.getAttributes());

        return new CustomOAuth2User(oauth2User, user);
    }
}
