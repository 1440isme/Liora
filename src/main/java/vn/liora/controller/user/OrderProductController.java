package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.OrderProductUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.User;
import vn.liora.service.IOrderProductService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/orderproducts/{idOrder}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderProductController {

    IOrderProductService orderProductService;
    @PutMapping("/{idOrderProduct}")
    public ResponseEntity<OrderProductResponse> updateOrderProduct(
            @PathVariable Long idOrderProduct,
            @RequestBody OrderProductUpdateRequest request) {

        OrderProductResponse response = orderProductService.updateOrderProduct(idOrderProduct, request);
        return ResponseEntity.ok(response);
    }
}
