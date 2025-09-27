package vn.liora.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // tắt CSRF để test POST/PUT dễ dàng
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/users/*").permitAll()
                        .requestMatchers("/users").permitAll()// mở cho endpoint /users
                        .anyRequest().authenticated()          // còn lại phải login
                );

        return http.build();
    }
}
