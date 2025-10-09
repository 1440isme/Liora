package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Product;
import vn.liora.mapper.ProductMapper;
import vn.liora.service.impl.ProductServiceImpl;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {
    @Autowired
    private ProductServiceImpl  productService;

    @Autowired
    private ProductMapper productMapper;

    // ========== BASIC CRUD ==========
    @PostMapping
    ApiResponse<Product> createProduct(@RequestBody ProductCreationRequest request) {
        try {
            System.out.println("=== CONTROLLER START ===");
            ApiResponse<Product> apiResponse = new ApiResponse<>();
            Product product = productService.createProduct(request);
            System.out.println("Service OK: " + product.getProductId());
            apiResponse.setResult(product);
            System.out.println("=== CONTROLLER SUCCESS ===");
            return apiResponse;
        } catch (Exception e) {
            System.out.println("CONTROLLER ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    ApiResponse<ProductResponse> getProductById(@PathVariable Long id) {
        ApiResponse<ProductResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findById(id));
        return apiResponse;
    }

    @PutMapping("/{id}")
    ApiResponse<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody ProductUpdateRequest request) {
        ApiResponse<ProductResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.updateProduct(id, request));
        return apiResponse;
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteProduct(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.deleteById(id);
        apiResponse.setResult("Product deleted successfully");
        return apiResponse;
    }

    // ========== FIND ALL ==========
    @GetMapping
    ApiResponse<Page<Product>> getAllProducts(Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findAll(pageable));
        return apiResponse;
    }

    @GetMapping("/all")
    ApiResponse<List<Product>> getAllProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findAll());
        return apiResponse;
    }

    // ========== SEARCH ==========
    @GetMapping("/search")
    ApiResponse<Page<Product>> searchProducts(@RequestParam String name, Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByNameContaining(name, pageable));
        return apiResponse;
    }

    // ========== STATUS FILTERS ==========
    @GetMapping("/active")
    ApiResponse<List<Product>> getActiveProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveProducts());
        return apiResponse;
    }

    @GetMapping("/inactive")
    ApiResponse<List<Product>> getInactiveProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findInactiveProducts());
        return apiResponse;
    }

    @GetMapping("/available")
    ApiResponse<List<Product>> getAvailableProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findAvailableProducts());
        return apiResponse;
    }

    @GetMapping("/unavailable")
    ApiResponse<List<Product>> getUnavailableProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findUnavailableProducts());
        return apiResponse;
    }

    @GetMapping("/active-available")
    ApiResponse<List<Product>> getActiveAvailableProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableProducts());
        return apiResponse;
    }

    // ========== BRAND & CATEGORY FILTERS ==========
    @GetMapping("/brand/{brandId}")
    ApiResponse<List<Product>> getProductsByBrand(@PathVariable Long brandId) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByBrand(brandId));
        return apiResponse;
    }

    @GetMapping("/category/{categoryId}")
    ApiResponse<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByCategory(categoryId));
        return apiResponse;
    }

    @GetMapping("/brand/{brandId}/active")
    ApiResponse<List<Product>> getActiveProductsByBrand(@PathVariable Long brandId) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveByBrand(brandId));
        return apiResponse;
    }

    @GetMapping("/category/{categoryId}/active")
    ApiResponse<List<Product>> getActiveProductsByCategory(@PathVariable Long categoryId) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveByCategory(categoryId));
        return apiResponse;
    }

    // ========== PRICE FILTERS ==========
    @GetMapping("/price-range")
    ApiResponse<List<Product>> getProductsByPriceRange(@RequestParam BigDecimal minPrice, @RequestParam BigDecimal maxPrice) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByPriceRange(minPrice, maxPrice));
        return apiResponse;
    }

    @GetMapping("/price-max")
    ApiResponse<List<Product>> getProductsByMaxPrice(@RequestParam BigDecimal maxPrice) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByPriceLessThanEqual(maxPrice));
        return apiResponse;
    }

    @GetMapping("/price-min")
    ApiResponse<List<Product>> getProductsByMinPrice(@RequestParam BigDecimal minPrice) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByPriceGreaterThanEqual(minPrice));
        return apiResponse;
    }

    @GetMapping("/active-available/price-range")
    ApiResponse<List<Product>> getActiveAvailableProductsByPriceRange(@RequestParam BigDecimal minPrice, @RequestParam BigDecimal maxPrice) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableByPriceRange(minPrice, maxPrice));
        return apiResponse;
    }

    // ========== STOCK FILTERS ==========
    @GetMapping("/in-stock")
    ApiResponse<List<Product>> getInStockProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findInStockProducts());
        return apiResponse;
    }

    @GetMapping("/out-of-stock")
    ApiResponse<List<Product>> getOutOfStockProducts() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findOutOfStockProducts());
        return apiResponse;
    }

    @GetMapping("/stock-greater")
    ApiResponse<List<Product>> getProductsByMinStock(@RequestParam Integer minStock) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByStockGreaterThan(minStock));
        return apiResponse;
    }

    @GetMapping("/stock-range")
    ApiResponse<List<Product>> getProductsByStockRange(@RequestParam Integer minStock, @RequestParam Integer maxStock) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByStockRange(minStock, maxStock));
        return apiResponse;
    }

    // ========== RATING FILTERS ==========
    @GetMapping("/high-rated")
    ApiResponse<List<Product>> getHighRatedProducts(@RequestParam BigDecimal minRating) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findProductsByMinRating(minRating));
        return apiResponse;
    }

    @GetMapping("/rating-range")
    ApiResponse<List<Product>> getProductsByRatingRange(@RequestParam BigDecimal minRating, @RequestParam BigDecimal maxRating) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findByRatingRange(minRating, maxRating));
        return apiResponse;
    }

    // ========== COMBINED FILTERS ==========
    @GetMapping("/brand/{brandId}/category/{categoryId}/active-available")
    ApiResponse<List<Product>> getActiveAvailableProductsByBrandAndCategory(@PathVariable Long brandId, @PathVariable Long categoryId) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableByBrandAndCategory(brandId, categoryId));
        return apiResponse;
    }

    @GetMapping("/search-active-available")
    ApiResponse<Page<Product>> searchActiveAvailableProducts(@RequestParam String keyword, Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.searchActiveAvailableProducts(keyword, pageable));
        return apiResponse;
    }

    // ========== SORTING ==========
    @GetMapping("/sort/price-asc")
    ApiResponse<List<Product>> getProductsSortedByPriceAsc() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableOrderByPriceAsc());
        return apiResponse;
    }

    @GetMapping("/sort/price-desc")
    ApiResponse<List<Product>> getProductsSortedByPriceDesc() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableOrderByPriceDesc());
        return apiResponse;
    }

    @GetMapping("/sort/rating-desc")
    ApiResponse<List<Product>> getProductsSortedByRatingDesc() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableOrderByRatingDesc());
        return apiResponse;
    }

    @GetMapping("/sort/sold-desc")
    ApiResponse<List<Product>> getProductsSortedBySoldCountDesc() {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveAvailableOrderBySoldCountDesc());
        return apiResponse;
    }

    // ========== BUSINESS QUERIES ==========
    @GetMapping("/top-selling")
    ApiResponse<List<Product>> getTopSellingProducts(Pageable pageable) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findTopSellingInStockProducts(pageable));
        return apiResponse;
    }

    @GetMapping("/newest")
    ApiResponse<List<Product>> getNewestProducts(Pageable pageable) {
        ApiResponse<List<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findNewestProducts(pageable));
        return apiResponse;
    }

    // ========== ADMIN QUERIES ==========
    @GetMapping("/admin/active")
    ApiResponse<Page<Product>> getActiveProductsWithPagination(Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findActiveProductsWithPagination(pageable));
        return apiResponse;
    }

    @GetMapping("/admin/available")
    ApiResponse<Page<Product>> getAvailableProductsWithPagination(Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findAvailableProductsWithPagination(pageable));
        return apiResponse;
    }

    @GetMapping("/admin/inactive")
    ApiResponse<Page<Product>> getInactiveProductsWithPagination(Pageable pageable) {
        ApiResponse<Page<Product>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.findInactiveProductsWithPagination(pageable));
        return apiResponse;
    }

    // ========== STATUS MANAGEMENT ==========
    @PutMapping("/{id}/activate")
    ApiResponse<String> activateProduct(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.activateProduct(id);
        apiResponse.setResult("Product activated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/deactivate")
    ApiResponse<String> deactivateProduct(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.deactivateProduct(id);
        apiResponse.setResult("Product deactivated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/available")
    ApiResponse<String> setProductAvailable(@PathVariable Long id, @RequestParam Boolean available) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.setAvailable(id, available);
        apiResponse.setResult("Product availability updated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/stock")
    ApiResponse<String> updateProductStock(@PathVariable Long id, @RequestParam Integer stock) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.updateStock(id, stock);
        apiResponse.setResult("Product stock updated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/sold-count")
    ApiResponse<String> updateProductSoldCount(@PathVariable Long id, @RequestParam Integer soldCount) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        productService.updateSoldCount(id, soldCount);
        apiResponse.setResult("Product sold count updated successfully");
        return apiResponse;
    }

    // ========== STATISTICS ==========
    @GetMapping("/stats/active-count")
    ApiResponse<Long> getActiveProductsCount() {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.countActiveProducts());
        return apiResponse;
    }

    @GetMapping("/stats/available-count")
    ApiResponse<Long> getAvailableProductsCount() {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.countActiveAvailableProducts());
        return apiResponse;
    }

    @GetMapping("/stats/out-of-stock-count")
    ApiResponse<Long> getOutOfStockProductsCount() {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.countOutOfStockProducts());
        return apiResponse;
    }

    @GetMapping("/stats/brand/{brandId}/count")
    ApiResponse<Long> getProductsCountByBrand(@PathVariable Long brandId) {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.countByBrand(brandId));
        return apiResponse;
    }

    @GetMapping("/stats/category/{categoryId}/count")
    ApiResponse<Long> getProductsCountByCategory(@PathVariable Long categoryId) {
        ApiResponse<Long> apiResponse = new ApiResponse<>();
        apiResponse.setResult(productService.countByCategory(categoryId));
        return apiResponse;
    }
}
