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
import vn.liora.enums.Role;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IAuthenticationService;
import vn.liora.service.Authen.AuthenticationStrategyFactory;

@Controller
@RequiredArgsConstructor
public class OAuth2Controller {

    private final IAuthenticationService authenticationService;
    private final AuthenticationStrategyFactory strategyFactory;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @GetMapping("/authenticate")
    public RedirectView handleOAuth2Success() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return new RedirectView("/?auth=error");
            }

            Object principal = authentication.getPrincipal();
            User userEntity = null;

            if (principal instanceof CustomOAuth2User customUser) {
                userEntity = customUser.getUser();
            } else if (authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauthToken) {
                String provider = oauthToken.getAuthorizedClientRegistrationId().toUpperCase();
                vn.liora.service.Authen.LoginStrategy strategy = strategyFactory.getStrategy(provider);

                java.util.Map<String, Object> attrs = java.util.Collections.emptyMap();
                if (principal instanceof OidcUser oidcUser) {
                    attrs = oidcUser.getClaims();
                } else if (principal instanceof OAuth2User oauth2User) {
                    attrs = oauth2User.getAttributes();
                }

                userEntity = strategy.login(attrs);
            } else {
                return new RedirectView("/?auth=error");
            }

            if (Boolean.FALSE.equals(userEntity.getActive())) {
                return new RedirectView("/?auth=error&reason=locked");
            }
            String token = authenticationService.generateTokenForOAuth2User(userEntity);
            return new RedirectView("/?token=" + token + "&auth=success");
        } catch (JOSEException e) {
            return new RedirectView("/?auth=error");
        }
    }
}
