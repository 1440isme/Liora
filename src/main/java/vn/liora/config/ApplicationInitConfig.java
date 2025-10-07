package vn.liora.config;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.liora.entity.User;
import vn.liora.enums.Role;
import vn.liora.repository.UserRepository;
import vn.liora.repository.RoleRepository;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                var adminRole = roleRepository.findById(Role.ADMIN.name())
                        .orElseGet(() -> {
                            var r = vn.liora.entity.Role.builder()
                                    .name(Role.ADMIN.name())
                                    .description("Administrator")
                                    .build();
                            return roleRepository.save(r);
                        });
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .email("admin@liora.com")
                        .firstname("Admin")
                        .lastname("User")
                        .active(true)
                        .roles(Set.of(adminRole))
                        .build();
                userRepository.save(user);
                log.warn("Create admin with password default: admin, please change it");
            }
        };
    }
}
