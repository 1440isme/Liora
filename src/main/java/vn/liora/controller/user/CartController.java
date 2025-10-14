package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    ICartService cartService;

    @Autowired
    ICartProductService cartProductService;
    
    @Autowired
    UserRepository userRepository;

    @GetMapping("/cart")
    public String viewCart() {
        return "user/cart/view-cart";
    }

    /**
     * API để lấy thông tin giỏ hàng của user hiện tại
     */
    @GetMapping("/cart/api/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentUserCart() {
        try {
            // Lấy userId từ security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Lấy giỏ hàng của user
            var cartResponse = cartService.getCart(user.getUserId());
            
            return ResponseEntity.ok().body(new Object() {
                @SuppressWarnings("unused")
                public final Long cartId = cartResponse.getIdCart();
                @SuppressWarnings("unused")
                public final String message = "Cart found";
            });

        } catch (AppException e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error getting current user cart: ", e);
            return ResponseEntity.badRequest().body("Unable to get cart information");
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
