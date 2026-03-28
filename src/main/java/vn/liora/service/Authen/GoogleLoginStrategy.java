package vn.liora.service.Authen;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.liora.entity.User;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;

import java.util.Map;

@Component("GOOGLE")
public class GoogleLoginStrategy extends AbstractOAuth2LoginStrategy {

    public GoogleLoginStrategy(UserRepository userRepository, RoleRepository roleRepository) {
        super(userRepository, roleRepository);
    }

    @Override
    public User login(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        return userRepository.findByEmail(email).orElseGet(() -> {
            var duplicates = userRepository.findAllByEmail(email);
            if (duplicates != null && !duplicates.isEmpty()) {
                return duplicates.get(0);
            }
            // Gọi hàm đã dùng chung ở Class cha (AbstractOAuth2LoginStrategy)
            return createNewUser(email, name, picture);
        });
    }
}
