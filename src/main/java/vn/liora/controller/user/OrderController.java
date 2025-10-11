package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

import java.util.List;

@RestController
@RequestMapping("/order/{userId}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OrderController {

    IOrderService orderService;
    UserRepository userRepository;

    // ✅ 1. Tạo đơn hàng mới
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @PathVariable Long userId,
            @Valid @RequestBody OrderCreationRequest request) {


        OrderResponse response = orderService.createOrder(userId, request);
        return ResponseEntity.ok(response);
    }



    // ✅ 3. Xem chi tiết đơn hàng của chính người dùng
    @GetMapping("/{idOrder}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long idOrder) {
        OrderResponse response = orderService.getOrderById(idOrder);
        return ResponseEntity.ok(response);
    }

    // ✅ 4. Lấy danh sách đơn hàng của người dùng hiện tại
    @GetMapping()
    public ResponseEntity<List<OrderResponse>> getMyOrders(@PathVariable Long userId) {
        List<OrderResponse> response = orderService.getMyOrders(userId);
        return ResponseEntity.ok(response);
    }

}
