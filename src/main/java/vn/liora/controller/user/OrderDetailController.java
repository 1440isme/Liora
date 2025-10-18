package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

@Controller
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
public class OrderDetailController {

    private final IOrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/order-detail/{orderId}")
    public String viewOrderDetail(@PathVariable Long orderId, @RequestParam(required = false) String token,
            Model model) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                // Nếu có token trong URL, thử xác thực với token đó
                if (token != null && !token.isEmpty()) {
                    // Thử xác thực trực tiếp với token
                    try {
                        // Tạo Authentication từ token
                        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authToken = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                token, null, null);

                        // Set vào SecurityContext
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        // Thử lại với authentication mới
                        User user = findUserByPrincipal(authToken);
                        if (user == null) {
                            return "redirect:/home";
                        }
                    } catch (Exception e) {
                        log.error("Error authenticating with token: {}", e.getMessage());
                        return "redirect:/home";
                    }
                } else {
                    return "redirect:/home";
                }
            }

            // Lấy authentication hiện tại (có thể đã được set từ token)
            Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
            User user = findUserByPrincipal(currentAuth);

            if (user == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            var orderResponse = orderService.getOrderById(orderId);

            // Kiểm tra xem đơn hàng có thuộc về user này không
            if (orderResponse == null || !orderResponse.getUserId().equals(user.getUserId())) {
                model.addAttribute("error", "Đơn hàng không tồn tại hoặc không thuộc về bạn");
                return "redirect:/";
            }

            // Lấy danh sách sản phẩm trong đơn hàng
            var orderProducts = orderService.getProductsByOrderId(orderId);

            model.addAttribute("order", orderResponse);
            model.addAttribute("orderProducts", orderProducts);
            model.addAttribute("user", user);

            return "user/order/order-detail";

        } catch (Exception e) {
            log.error("Error in viewOrderDetail: {}", e.getMessage(), e);
            model.addAttribute("error", "Không thể tải chi tiết đơn hàng");
            return "redirect:/";
        }
    }

    /**
     * Tìm user từ authentication, hỗ trợ cả JWT và OAuth2
     */
    private User findUserByPrincipal(Authentication authentication) {
        String principalName = authentication.getName();

        // 1. Nếu là OAuth2 user, lấy user từ CustomOAuth2User trước
        if (authentication.getPrincipal() instanceof vn.liora.dto.CustomOAuth2User) {
            vn.liora.dto.CustomOAuth2User customOAuth2User = (vn.liora.dto.CustomOAuth2User) authentication
                    .getPrincipal();
            return customOAuth2User.getUser();
        }

        // 2. Nếu là OAuth2User thông thường, thử tìm bằng email từ attributes
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User = (org.springframework.security.oauth2.core.user.OAuth2User) authentication
                    .getPrincipal();

            // Lấy email từ OAuth2User attributes
            String email = oauth2User.getAttribute("email");

            if (email != null) {
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    return user;
                }
            }
        }

        // 3. Thử tìm bằng username
        User user = userRepository.findByUsername(principalName).orElse(null);
        if (user != null) {
            return user;
        }

        // 4. Thử tìm bằng email nếu principal name chứa @
        if (principalName != null && principalName.contains("@")) {
            user = userRepository.findByEmail(principalName).orElse(null);
            if (user != null) {
                return user;
            }
        }

        return null;
    }

}