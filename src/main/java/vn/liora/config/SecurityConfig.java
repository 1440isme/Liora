package vn.liora.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final String[] PUBLIC_ENDPOINTS = {
                        "/users", "/auth/token", "/auth/introspect", "/auth/logout", "/auth/refresh",
                        "/brands/**", "/categories/**", "/products/**", "/admin/login", "/home",
                        "/admin/permission/*", "/admin/roles/*",
                        // static resources
                        "/", "/favicon.ico", "/static/**", "/user/**", "/css/**", "/js/**", "/images/**", "/webjars/**",
                        // admin static resources - CỤ THỂ HƠN
                        "/admin/css/**", "/admin/js/**", "/admin/images/**", "/admin/fonts/**", "/admin/vendors/**",
                        // upload endpoints
                        "/admin/api/upload/**", "/uploads/**",
                        // admin pages - CHỈ CHO PHÉP TRUY CẬP TRANG ADMIN, KHÔNG BAO GỒM STATIC
                        "/admin", "/admin/dashboard", "/admin/brands/**", "/admin/categories/**", "/admin/products/**",
                        "/admin/orders/**", "/admin/users/**",
                        // API endpoints - CHO PHÉP TRUY CẬP KHÔNG CẦN XÁC THỰC
                        "/admin/api/**",
                        "/oauth2/**", "/login/oauth2/**", "/authenticate", "/auth/google/**"
        };

        @Autowired
        private CustomJwtDecoder customJwtDecoder;

        @Autowired
        private OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
                httpSecurity
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                                                .requestMatchers("/info").permitAll()
                                                .requestMatchers("/users/myInfo").authenticated()
                                                .anyRequest().permitAll())
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage("/login")
                                                .defaultSuccessUrl("/authenticate", true)
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService)))
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .bearerTokenResolver(bearerTokenResolver())
                                                .jwt(jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder)
                                                                .jwtAuthenticationConverter(
                                                                                jwtAuthenticationConverter()))
                                                .authenticationEntryPoint(new JwtAuthenticationEntryPoint()));

                httpSecurity.csrf(AbstractHttpConfigurer::disable);
                return httpSecurity.build();
        }

        @Bean
        public CorsFilter corsFilter() {
                CorsConfiguration corsConfiguration = new CorsConfiguration();
                corsConfiguration.addAllowedOrigin("*");
                corsConfiguration.addAllowedMethod("*");
                corsConfiguration.addAllowedHeader("*");

                UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
                urlBasedCorsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);
                return new CorsFilter(urlBasedCorsConfigurationSource);

        }

        @Bean
        JwtAuthenticationConverter jwtAuthenticationConverter() {
                JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
                jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");

                JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
                jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);

                return jwtAuthenticationConverter;
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(10);
        }

        @Bean
        public BearerTokenResolver bearerTokenResolver() {
                DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
                defaultResolver.setBearerTokenHeaderName("Authorization");
                return new BearerTokenResolver() {
                        @Override
                        public String resolve(HttpServletRequest request) {
                                // 1) Try Authorization header first
                                String token = defaultResolver.resolve(request);
                                if (token != null)
                                        return token;
                                // 2) Try access_token cookie
                                Cookie[] cookies = request.getCookies();
                                if (cookies != null) {
                                        for (Cookie c : cookies) {
                                                if ("access_token".equals(c.getName())) {
                                                        return c.getValue();
                                                }
                                        }
                                }
                                return null;
                        }
                };
        }
}
