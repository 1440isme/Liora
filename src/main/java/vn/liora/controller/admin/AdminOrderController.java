package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.repository.UserRepository;
import vn.liora.service.IOrderService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminOrderController {
    IOrderService orderService;
    UserRepository userRepository;
    @PutMapping("/{idOrder}")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long idOrder,
            @RequestBody OrderUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(idOrder, request);
        return ResponseEntity.ok(response);
    }
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    // Lấy đơn hàng theo trạng thái đơn hàng
    @GetMapping("/order-status")
    public ResponseEntity<List<OrderResponse>> getOrdersByOrderStatus(@RequestParam String orderStatus) {
        List<OrderResponse> orders = orderService.getOrdersByOrderStatus(orderStatus);
        return ResponseEntity.ok(orders);
    }

    // Lấy đơn hàng theo khoảng thời gian
    @GetMapping("/date-range")
    public ResponseEntity<List<OrderResponse>> getOrdersByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        List<OrderResponse> orders = orderService.getOrdersByDateRange(startDate,endDate);
        return ResponseEntity.ok(orders);
    }

    // Lấy tổng số đơn hàng của một user
    @GetMapping("/count/user/{userId}")
    public ResponseEntity<Long> countByUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(orderService.countByUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Lấy tổng doanh thu
    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getTotalRevenue() {
        BigDecimal total = orderService.getTotalRevenue();
        return ResponseEntity.ok(total);
    }

    // Lấy tổng doanh thu theo user
    @GetMapping("/revenue/user/{userId}")
    public ResponseEntity<BigDecimal> getTotalRevenueByUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(orderService.getTotalRevenueByUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }
}
