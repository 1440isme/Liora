package vn.liora.service.Authen;
// package vn.liora.service.strategy;

// import lombok.RequiredArgsConstructor;
// import org.springframework.stereotype.Component;
// import vn.liora.entity.User;
// import vn.liora.repository.RoleRepository;
// import vn.liora.repository.UserRepository;

// import java.util.Map;

// @Component("FACEBOOK")
// public class FacebookLoginStrategy extends AbstractOAuth2LoginStrategy {

// public FacebookLoginStrategy(UserRepository userRepository, RoleRepository
// roleRepository) {
// super(userRepository, roleRepository);
// }

// @Override
// public User login(Map<String, Object> attributes) {
// // Lấy thông tin từ Facebook trả về
// String email = (String) attributes.get("email");
// String facebookId = (String) attributes.get("id");
// String name = (String) attributes.get("name");

// // ÁP DỤNG THỦ THUẬT PSEUDO-EMAIL NẾU KHÁCH KHÔNG CUNG CẤP EMAIL
// if (email == null || email.isBlank()) {
// email = "facebook_" + facebookId + "@facebook.liora.vn";
// }

// final String finalEmail = email; // Cần thiết để dùng bên trong Lambda

// // Tìm User hoặc tạo mới
// return userRepository.findByEmail(finalEmail).orElseGet(() -> {
// var duplicates = userRepository.findAllByEmail(finalEmail);
// if (duplicates != null && !duplicates.isEmpty()) {
// return duplicates.get(0);
// }

// // Gán Avatar do Graph API của FB cung cấp
// String avatarUrl = facebookId != null ? "https://graph.facebook.com/" +
// facebookId + "/picture?type=large" : "";

// // Gọi hàm đã dùng chung ở Class cha (AbstractOAuth2LoginStrategy)
// return createNewUser(finalEmail, name, avatarUrl);
// });
// }
// }
