package vn.liora.Authen;

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
    public vn.liora.enums.AuthProvider getProvider() {
        return vn.liora.enums.AuthProvider.GOOGLE;
    }

    @Override
    public User login(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        return createOrGetUser(email, name, picture);
    }
}
