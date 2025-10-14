package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

@RestController
@RequestMapping("/api/user/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserOrderController {

    IOrderService orderService;
    UserRepository userRepository;

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelOrder(@PathVariable Long orderId) {
        log.info("Cancel order endpoint called for orderId: {}", orderId);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            log.info("Authentication: {}", authentication);
            
            if (authentication == null || !authentication.isAuthenticated()) {
                log.warn("User not authenticated");
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            log.info("Username: {}", username);
            
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            log.info("User found: {}", user.getUserId());

            // Kiểm tra xem đơn hàng có thuộc về user này không
            // và chỉ cho phép hủy nếu đơn hàng đang ở trạng thái PENDING
            orderService.cancelOrderByUser(orderId, user.getUserId());

            ApiResponse<String> response = new ApiResponse<>();
            response.setResult("Đơn hàng đã được hủy thành công");
            response.setMessage("Hủy đơn hàng thành công");

            log.info("Order {} cancelled successfully by user {}", orderId, user.getUserId());
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            log.error("AppException in cancel order: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error cancelling order: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
