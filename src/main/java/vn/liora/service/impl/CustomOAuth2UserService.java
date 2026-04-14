package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import vn.liora.dto.CustomOAuth2User;
import vn.liora.entity.User;
import vn.liora.Authen.OAuth2AuthenticationService;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuth2AuthenticationService oAuth2AuthenticationService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        // Lấy provider tương ứng (VD: GOOGLE)
        String providerStr = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        vn.liora.enums.AuthProvider provider = vn.liora.enums.AuthProvider.valueOf(providerStr);

        // Sử dụng Core Context Service theo đúng chuẩn bản thiết kế
        User user = oAuth2AuthenticationService.login(provider, oauth2User.getAttributes());

        return new CustomOAuth2User(oauth2User, user);
    }
}
