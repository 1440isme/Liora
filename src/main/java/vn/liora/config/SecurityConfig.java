package vn.liora.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final String[] PUBLIC_ENDPOINTS = {
                "/users", "/auth/token", "/auth/introspect", "/auth/logout", "/auth/refresh",
                "/brands/**", "/categories/**", "/products/**", "/admin/login", "/home",
                "/admin/permission/**", "/admin/roles/**",
                // static resources
                "/", "/favicon.ico", "/static/**", "/user/**", "/css/**", "/js/**", "/images/**", "/webjars/**",
                // admin static resources - CỤ THỂ HƠN
                "/admin/css/**", "/admin/js/**", "/admin/images/**", "/admin/fonts/**", "/admin/vendors/**",
                // upload endpoints
                "/admin/api/upload/**", "/uploads/**",
                // admin pages - CHỈ CHO PHÉP TRUY CẬP TRANG ADMIN, KHÔNG BAO GỒM STATIC
                "/admin" , "/admin/dashboard", "/admin/brands/**", "/admin/categories/**", "/admin/products/**", "/admin/orders/**", "/admin/users/**",
                // API endpoints - CHO PHÉP TRUY CẬP KHÔNG CẦN XÁC THỰC
                "/admin/api/**"
        };

        @Autowired
        private CustomJwtDecoder customJwtDecoder;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
                httpSecurity
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                                                .anyRequest().permitAll());
                httpSecurity.oauth2ResourceServer(oauth2 -> oauth2
                                .jwt(jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder)
                                                .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                                .authenticationEntryPoint((new JwtAuthenticationEntryPoint())));

                httpSecurity.csrf(AbstractHttpConfigurer::disable);
                return httpSecurity.build();
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
}
