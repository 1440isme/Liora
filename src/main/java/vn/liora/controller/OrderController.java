package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.OrderRepository;

import java.util.List;
import java.util.Optional;

@Controller("adminOrderController")
@RequestMapping("/admin")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderProductRepository orderProductRepository;

    @Autowired
    private OrderProductMapper orderProductMapper;

    @GetMapping("/orders")
    public String listOrders() {
        return "admin/orders/list";
    }

    @GetMapping("/orders/detail/{id}")
    public String orderDetail(@PathVariable("id") Long id, Model model) {
        model.addAttribute("orderId", id);
        return "admin/orders/detail";
    }

    // API endpoint để lấy danh sách sản phẩm trong đơn hàng
    @GetMapping("/api/orders/{orderId}/items")
    public ResponseEntity<List<OrderProductResponse>> getOrderItems(@PathVariable Long orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);
            List<OrderProductResponse> responses = orderProductMapper.toOrderProductResponseList(orderProducts);

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
