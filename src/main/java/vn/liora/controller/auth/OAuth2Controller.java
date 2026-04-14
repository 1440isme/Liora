package vn.liora.controller.auth;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;
import vn.liora.dto.CustomOAuth2User;
import vn.liora.entity.User;
import vn.liora.enums.AuthProvider;
import vn.liora.service.IAuthenticationService;
import vn.liora.Authen.OAuth2AuthenticationService;

import java.util.Collections;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class OAuth2Controller {

    // Inject Core Context Service thay vì Factory (Khớp 100% bản thiết kế mới)
    private final OAuth2AuthenticationService oauth2AuthService;
    private final IAuthenticationService authService;

    // Điểm mù của API (Controller đón Request)
    @GetMapping("/authenticate")
    public RedirectView authenticate() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return new RedirectView("/?auth=error");
        }

        Object principal = authentication.getPrincipal();

        // Trường hợp 1: Đã được handle qua Filter CustomOAuth2UserService
        if (principal instanceof CustomOAuth2User customUser) {
            return generateTokenAndRedirect(customUser.getUser());
        } 
        
        // Trường hợp 2: Khớp hoàn toàn với Core Module Design
        if (authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauthToken) {
            AuthProvider provider = AuthProvider.valueOf(oauthToken.getAuthorizedClientRegistrationId().toUpperCase());
            Map<String, Object> attributes = extractAttributes(principal);
            
            // Gọi Core Service để lấy User
            User userEntity = oauth2AuthService.login(provider, attributes);
            return generateTokenAndRedirect(userEntity);
        }

        return new RedirectView("/?auth=error");
    }

    private RedirectView generateTokenAndRedirect(User userEntity) {
        if (Boolean.FALSE.equals(userEntity.getActive())) {
            return new RedirectView("/?auth=error&reason=locked");
        }
        try {
            String token = authService.generateTokenForOAuth2User(userEntity);
            return new RedirectView("/?token=" + token + "&auth=success");
        } catch (JOSEException e) {
            return new RedirectView("/?auth=error");
        }
    }

    private Map<String, Object> extractAttributes(Object principal) {
        if (principal instanceof OidcUser oidcUser) {
            return oidcUser.getClaims();
        } else if (principal instanceof OAuth2User oauth2User) {
            return oauth2User.getAttributes();
        }
        return Collections.emptyMap();
    }
}
