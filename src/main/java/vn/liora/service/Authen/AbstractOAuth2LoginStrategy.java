package vn.liora.service.Authen;

import lombok.RequiredArgsConstructor;
import vn.liora.entity.Role;
import vn.liora.entity.User;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;

@RequiredArgsConstructor
public abstract class AbstractOAuth2LoginStrategy implements LoginStrategy {

    protected final UserRepository userRepository;
    protected final RoleRepository roleRepository;

    protected User createNewUser(String email, String name, String avatarUrl) {
        // Sinh username an toàn (để tránh lỗi trùng db)
        String username = email != null && email.contains("@") ? email.split("@")[0] : "user";
        String originalUsername = username;
        int counter = 1;

        while (userRepository.findByUsername(username).isPresent()) {
            username = originalUsername + counter++;
        }

        // Tách Firstname và Lastname
        String[] nameParts = name != null ? name.split(" ") : new String[] { username };
        String firstname = nameParts.length > 0 ? nameParts[0] : username;
        String lastname = nameParts.length > 1
                ? String.join(" ", Arrays.copyOfRange(nameParts, 1, nameParts.length))
                : "";

        // Gán Role USER mặc định do Liora định nghĩa
        Role userRole = roleRepository.findById(vn.liora.enums.Role.USER.name())
                .orElseThrow(() -> new RuntimeException("Role USER not found"));

        // Tạo Entity User và lưu vào Database
        User newUser = User.builder()
                .username(username)
                .email(email)
                .firstname(firstname)
                .lastname(lastname)
                .avatar(avatarUrl)
                .password("") // Rỗng vì đang dùng OAuth2
                .active(true)
                .createdDate(LocalDate.now())
                .roles(Set.of(userRole))
                .build();

        return userRepository.save(newUser);
    }
}
