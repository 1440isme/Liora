package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartProductService;
import vn.liora.service.ICartService;

import java.util.List;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartController {

    final ICartService cartService;
    final ICartProductService cartProductService;
    final UserRepository userRepository;

    @GetMapping("/cart")
    public String viewCart() {
        return "user/cart/view-cart";
    }

    /**
     * Test endpoint để kiểm tra authentication
     */
    @GetMapping("/cart/api/test")
    @ResponseBody
    public ResponseEntity<?> testAuth() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return ResponseEntity.ok().body(new Object() {
                public final String auth = authentication != null ? authentication.toString() : "null";
                public final boolean isAuthenticated = authentication != null && authentication.isAuthenticated();
                public final String name = authentication != null ? authentication.getName() : "null";
            });
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * API để lấy thông tin giỏ hàng của user hiện tại
     */
    @GetMapping("/cart/api/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentUserCart() {
        try {
            log.info("Getting current user cart...");
            
            // Lấy userId từ security context
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

            // Lấy giỏ hàng của user
            var cartResponse = cartService.getCart(user.getUserId());
            log.info("Cart response: {}", cartResponse);
            
            return ResponseEntity.ok().body(new Object() {
                public final Long cartId = cartResponse.getIdCart();
                public final String message = "Cart found";
            });

        } catch (AppException e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.status(500).body("Unable to get cart information: " + e.getMessage());
        }
    }

    /**
     * API để lấy danh sách sản phẩm trong giỏ hàng
     */
    @GetMapping("/cart/api/{cartId}/items")
    @ResponseBody
    public ResponseEntity<List<CartProductResponse>> getCartItems(@PathVariable Long cartId) {
        try {
            List<CartProductResponse> cartItems = cartProductService.getAllProductsInCart(cartId);
            return ResponseEntity.ok(cartItems);
        } catch (Exception e) {
            log.error("Error getting cart items: ", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * API để lấy số lượng sản phẩm trong giỏ hàng (cho header)
     */
    @GetMapping("/cart/api/{cartId}/count")
    @ResponseBody
    public ResponseEntity<Integer> getCartItemCount(@PathVariable Long cartId) {
        try {
            int count = cartProductService.getCartItemCount(cartId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting cart item count: ", e);
            return ResponseEntity.ok(0);
        }
    }

    /**
     * API để lấy tổng giá trị giỏ hàng
     */
    @GetMapping("/cart/api/{cartId}/total")
    @ResponseBody
    public ResponseEntity<Double> getCartTotal(@PathVariable Long cartId) {
        try {
            double total = cartProductService.getCartTotal(cartId);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            log.error("Error getting cart total: ", e);
            return ResponseEntity.ok(0.0);
        }
    }
}
