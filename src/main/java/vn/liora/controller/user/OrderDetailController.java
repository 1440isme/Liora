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
    public String viewOrderDetail(@PathVariable Long orderId, Model model) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return "redirect:/login";
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Kiểm tra xem đơn hàng có thuộc về user này không
            var orderResponse = orderService.getOrderById(orderId);
            if (orderResponse == null || !orderResponse.getUserId().equals(user.getUserId())) {
                model.addAttribute("error", "Đơn hàng không tồn tại hoặc không thuộc về bạn");
                return "error/404";
            }

            // Lấy danh sách sản phẩm trong đơn hàng
            var orderProducts = orderService.getProductsByOrderId(orderId);

            model.addAttribute("order", orderResponse);
            model.addAttribute("orderProducts", orderProducts);
            model.addAttribute("user", user);

            return "user/order/order-detail";

        } catch (Exception e) {
            log.error("Error loading order detail: {}", e.getMessage());
            model.addAttribute("error", "Không thể tải chi tiết đơn hàng");
            return "error/404";
        }
    }
}
