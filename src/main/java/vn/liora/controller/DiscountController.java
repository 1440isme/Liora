package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ApplyDiscountRequest;
import vn.liora.dto.request.DiscountCreationRequest;
import vn.liora.dto.request.DiscountUpdateRequest;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.entity.Discount;
import vn.liora.service.impl.DiscountServiceImpl;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/discounts")
public class DiscountController {
    
    @Autowired
    private DiscountServiceImpl discountService;

    // ========== BASIC CRUD ==========
    @PostMapping
    ApiResponse<Discount> createDiscount(@RequestBody DiscountCreationRequest request) {
        try {
            System.out.println("=== CONTROLLER START ===");
            ApiResponse<Discount> apiResponse = new ApiResponse<>();
            Discount discount = discountService.createDiscount(request);
            System.out.println("Service OK: " + discount.getDiscountId());
            apiResponse.setResult(discount);
            System.out.println("=== CONTROLLER SUCCESS ===");
            return apiResponse;
        } catch (Exception e) {
            System.out.println("CONTROLLER ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    ApiResponse<DiscountResponse> getDiscountById(@PathVariable Long id) {
        ApiResponse<DiscountResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findById(id));
        return apiResponse;
    }

    @PutMapping("/{id}")
    ApiResponse<DiscountResponse> updateDiscount(@PathVariable Long id, @RequestBody DiscountUpdateRequest request) {
        ApiResponse<DiscountResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.updateDiscount(id, request));
        return apiResponse;
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteDiscount(@PathVariable Long id) {
        discountService.deleteById(id);
        return ApiResponse.<String>builder().result("Discount has been deleted").build();
    }

    // ========== FIND ALL ==========
    @GetMapping
    ApiResponse<List<Discount>> getAllDiscounts() {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findAll());
        return apiResponse;
    }

    @GetMapping("/page")
    ApiResponse<Page<Discount>> getAllDiscountsWithPagination(Pageable pageable) {
        ApiResponse<Page<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findAll(pageable));
        return apiResponse;
    }

    // ========== BASIC SEARCH ==========
    @GetMapping("/name/{name}")
    ApiResponse<DiscountResponse> getDiscountByName(@PathVariable String name) {
        ApiResponse<DiscountResponse> apiResponse = new ApiResponse<>();
        discountService.findByName(name).ifPresent(discount -> {
            apiResponse.setResult(discountService.findById(discount.getDiscountId()));
        });
        return apiResponse;
    }

    @GetMapping("/search/{name}")
    ApiResponse<List<Discount>> searchDiscountsByName(@PathVariable String name) {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findByNameContaining(name));
        return apiResponse;
    }

    @GetMapping("/search/{name}/page")
    ApiResponse<Page<Discount>> searchDiscountsByNameWithPagination(@PathVariable String name, Pageable pageable) {
        ApiResponse<Page<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findByNameContaining(name, pageable));
        return apiResponse;
    }

    // ========== BY STATUS ==========
    @GetMapping("/active")
    ApiResponse<List<Discount>> getActiveDiscounts() {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findActiveDiscounts());
        return apiResponse;
    }

    @GetMapping("/inactive")
    ApiResponse<List<Discount>> getInactiveDiscounts() {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findInactiveDiscounts());
        return apiResponse;
    }

    @GetMapping("/active/page")
    ApiResponse<Page<Discount>> getActiveDiscountsWithPagination(Pageable pageable) {
        ApiResponse<Page<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findActiveDiscounts(pageable));
        return apiResponse;
    }

    // ========== AVAILABLE DISCOUNTS ==========
    @GetMapping("/available")
    ApiResponse<List<Discount>> getAvailableDiscounts() {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findAvailableDiscounts());
        return apiResponse;
    }

    @GetMapping("/available/order-total/{orderTotal}")
    ApiResponse<List<Discount>> getAvailableDiscountsForOrder(@PathVariable BigDecimal orderTotal) {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.findAvailableDiscountsForOrder(orderTotal));
        return apiResponse;
    }

    // ========== BUSINESS LOGIC ==========
    @GetMapping("/{id}/calculate/{orderTotal}")
    ApiResponse<BigDecimal> calculateDiscountAmount(@PathVariable Long id, @PathVariable BigDecimal orderTotal) {
        ApiResponse<BigDecimal> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.calculateDiscountAmount(id, orderTotal));
        return apiResponse;
    }

    @GetMapping("/{id}/can-apply/user/{userId}/order-total/{orderTotal}")
    ApiResponse<Boolean> canApplyDiscount(@PathVariable Long id, @PathVariable Long userId, @PathVariable BigDecimal orderTotal) {
        ApiResponse<Boolean> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.canApplyDiscount(id, userId, orderTotal));
        return apiResponse;
    }

    // ========== ORDER DISCOUNT MANAGEMENT ==========
    @PostMapping("/apply")
    ApiResponse<String> applyDiscountToOrder(@RequestBody ApplyDiscountRequest request) {
        discountService.applyDiscountToOrder(request);
        return ApiResponse.<String>builder().result("Discount applied successfully").build();
    }

    @DeleteMapping("/remove/order/{orderId}/discount/{discountId}")
    ApiResponse<String> removeDiscountFromOrder(@PathVariable Long orderId, @PathVariable Long discountId) {
        discountService.removeDiscountFromOrder(orderId, discountId);
        return ApiResponse.<String>builder().result("Discount removed successfully").build();
    }

    @GetMapping("/order/{orderId}")
    ApiResponse<List<Discount>> getDiscountsByOrder(@PathVariable Long orderId) {
        ApiResponse<List<Discount>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.getDiscountsByOrder(orderId));
        return apiResponse;
    }

    // ========== STATISTICS ==========
    @GetMapping("/count")
    ApiResponse<Long> getDiscountCount() {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.count());
        return apiResponse;
    }

    @GetMapping("/active/count")
    ApiResponse<Long> getActiveDiscountCount() {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.countActiveDiscounts());
        return apiResponse;
    }

    @GetMapping("/{id}/usage-count")
    ApiResponse<Long> getUsageCount(@PathVariable Long id) {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(discountService.getTotalUsageCount(id));
        return apiResponse;
    }
}
