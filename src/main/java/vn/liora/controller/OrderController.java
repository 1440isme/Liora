package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.Image;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.OrderRepository;
import vn.liora.service.IImageService;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderProductRepository orderProductRepository;

    @Autowired
    private OrderProductMapper orderProductMapper;

    @Autowired
    private IImageService imageService;

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

            // Set thông tin hình ảnh cho từng sản phẩm
            responses.forEach(response -> {
                try {
                    Optional<Image> mainImage = imageService.findMainImageByProductId(response.getIdProduct());
                    if (mainImage.isPresent()) {
                        response.setMainImageUrl(mainImage.get().getImageUrl());
                    }
                } catch (Exception e) {
                    System.err.println("Error loading image for product " + response.getIdProduct() + ": " + e.getMessage());
                }
            });

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            System.err.println("Error loading order items: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
