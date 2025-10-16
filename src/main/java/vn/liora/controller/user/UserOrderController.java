package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.service.IOrderService;

import java.util.List;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserOrderController {

    IOrderService orderService;

    // ✅ 1. Tạo đơn hàng mới
    @PostMapping("/{idCart}")
    public ResponseEntity<OrderResponse> createOrder(
            @PathVariable Long idCart,
            @Valid @RequestBody OrderCreationRequest request) {
        OrderResponse response = orderService.createOrder(idCart, request);
        return ResponseEntity.ok(response);
    }


    // ✅ 3. Xem chi tiết đơn hàng của chính người dùng
    @GetMapping("/{userId}/{idOrder}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long idOrder) {
        OrderResponse response = orderService.getOrderById(idOrder);
        return ResponseEntity.ok(response);
    }

    // ✅ 4. Lấy danh sách đơn hàng của người dùng hiện tại
    @GetMapping("/{userId}")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@PathVariable Long userId) {
        List<OrderResponse> response = orderService.getMyOrders(userId);
        return ResponseEntity.ok(response);
    }
}
