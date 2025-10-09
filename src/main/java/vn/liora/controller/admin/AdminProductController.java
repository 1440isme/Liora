package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.mapper.ProductMapper;
import vn.liora.service.IProductService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/admin/api/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor // tự động tạo constructor cho các final fields
public class AdminProductController {

    private final IProductService productService;
    private final ProductMapper productMapper;

    // ============== BASIC CRUD ==============
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductCreationRequest request){
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            // Thêm business validation
            if (request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                response.setCode(400);
                response.setMessage("Giá sản phẩm phải lớn hơn 0");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getStock() < 0) {
                response.setCode(400);
                response.setMessage("Số lượng tồn kho không được âm");
                return ResponseEntity.badRequest().body(response);
            }

            Product product = productService.createProduct(request);
            ProductResponse productResponse = productMapper.toProductResponse(product);
            response.setResult(productResponse);
            response.setMessage("Tạo sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        }
        catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String available,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minStock,
            @RequestParam(required = false) Integer maxStock,
            @RequestParam(required = false) String sortBy,
            Pageable pageable) {
        ApiResponse<Page<ProductResponse>> response = new ApiResponse<>();
        try {
            Page<Product> products;
            // Xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy);
            }

            // Tìm kiếm và lọc
            if (search != null && !search.trim().isEmpty()) {
                products = productService.findByNameContaining(search.trim(), pageable);
            } else {
                products = productService.findAll(pageable);
            }

            // Lọc theo trạng thái
            if (status != null && !status.isEmpty()) {
                List<Product> filteredProducts = products.getContent().stream()
                        .filter(product -> {
                            if ("active".equals(status)) return product.getIsActive();
                            if ("inactive".equals(status)) return !product.getIsActive();
                            return true;
                        })
                        .toList();

                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            // Lọc theo available
            if (available != null && !available.isEmpty()) {
                List<Product> filteredProducts = products.getContent().stream()
                        .filter(product -> {
                            if ("true".equals(available)) return product.getAvailable();
                            if ("false".equals(available)) return !product.getAvailable();
                            return true;
                        })
                        .toList();

                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            // lọc theo giá
            if (minPrice != null || maxPrice != null) {
                List<Product> filteredProducts = products.getContent().stream()
                        .filter(product -> {
                            BigDecimal price = product.getPrice();
                            if (minPrice != null && price.compareTo(minPrice) < 0) return false;
                            if (maxPrice != null && price.compareTo(maxPrice) > 0) return false;
                            return true;
                        })
                        .toList();

                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            // lọc theo stock
            if (minStock != null || maxStock != null) {
                List<Product> filteredProducts = products.getContent().stream()
                        .filter(product -> {
                            Integer stock = product.getStock();
                            if (minStock != null && stock < minStock) return false;
                            if (maxStock != null && stock > maxStock) return false;
                            return true;
                        })
                        .toList();
                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            // lọc theo brand 
            if (brandId != null) {
                List<Product> filteredProducts = products.getContent().stream()
                    .filter(product -> product.getBrand().getBrandId().equals(brandId))
                    .toList();
                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            // lọc theo category
            if (categoryId != null) {
                List<Product> filteredProducts = products.getContent().stream()
                    .filter(product -> product.getCategory().getCategoryId().equals(categoryId))
                    .toList();
                products = new PageImpl<>(
                        filteredProducts, pageable, filteredProducts.size()
                );
            }

            Page<ProductResponse> productResponses = products.map(productMapper::toProductResponse);
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            if (id <= 0){
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            ProductResponse productResponse = productService.findById(id);
            response.setResult(productResponse);
            response.setMessage("Lấy thông tin sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch(AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thông tin sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            // Validation ID
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            ProductResponse productResponse = productService.updateProduct(id, request);
            response.setResult(productResponse);
            response.setMessage("Cập nhật sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            productService.deleteById(id);
            response.setMessage("Xóa sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa sản phẩm: "  + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STATUS MANAGEMENT ==========
    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<String>> activateProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.activateProduct(id);
            response.setMessage("Kích hoạt sản phầm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        }  catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateProduct(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.deactivateProduct(id);
            response.setMessage("Ngừng hoạt động sản phầm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        }  catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi ngừng hoạt động sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/available")
    public ResponseEntity<ApiResponse<String>> availableProduct(
            @PathVariable Long id,
            @RequestParam Boolean available) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            productService.setAvailable(id, available);
            String message = available ? "Đặt sản phẩm còn hàng thành công" : "Đặt sản phẩm hết hàng thành công";
            response.setMessage(message);
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        }  catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật trạng thái sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== STOCK MANAGEMENT ==========
    @PutMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<String>> updateStock(
            @PathVariable Long id,
            @RequestParam Integer stock) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            productService.updateStock(id, stock);
            response.setMessage("Cập nhật số lượng tồn kho thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật tồn kho: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/sold-count")
    public ResponseEntity<ApiResponse<String>> updateSoldCount(
            @PathVariable Long id,
            @RequestParam Integer soldCount) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            productService.updateSoldCount(id, soldCount);
            response.setMessage("Cập nhật số lượng đã bán thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật số lượng đã bán: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    // ========== BULK OPERATIONS ==========
    @PutMapping("/bulk/activate")
    public ResponseEntity<ApiResponse<String>> bulkActivateProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Xử lý bulk
            for (Long id : productIds) {
                if (id <= 0) continue; // Skip invalid IDs
                productService.activateProduct(id);
            }
            response.setMessage("Kích hoạt hàng loạt sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        }catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/bulk/deactivate")
    public ResponseEntity<ApiResponse<String>> bulkDeactivateProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Xử lý bulk
            for (Long id : productIds) {
                if (id <= 0) continue; // Skip invalid IDs
                productService.deactivateProduct(id);
            }
            response.setMessage("Ngừng hoạt động hàng loạt sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi ngừng hoạt động hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<ApiResponse<String>> bulkDeleteProducts(@RequestBody List<Long> productIds) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            if (productIds == null || productIds.isEmpty()) {
                response.setCode(400);
                response.setMessage("Danh sách sản phẩm không được trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Xử lý bulk
            for (Long id : productIds) {
                if (id <= 0) continue; // Skip invalid IDs
                productService.deleteById(id);
            }
            response.setMessage("Xóa hàng loạt sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa hàng loạt sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // ========== STATISTICS ==========
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Object>> getProductStatistics() {
        ApiResponse<Object> response = new ApiResponse<>();
        try {
            Long totalCount = productService.count();
            Long activeCount = productService.countActiveProducts();
            Long activeAvailableCount = productService.countActiveAvailableProducts();
            Long outOfStockCount = productService.countOutOfStockProducts();

            var statistics = new Object() {
                public final Long totalProducts = totalCount;
                public final Long activeProducts = activeCount;
                public final Long activeAvailableProducts = activeAvailableCount;
                public final Long outOfStockProducts = outOfStockCount;
                public final Long inactiveProducts = totalProducts - activeProducts;
                public final Long unavailableProducts = activeProducts - activeAvailableProducts;
            };

            response.setResult(statistics);
            response.setMessage("Lấy thống kê sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thống kê sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/statistics/by-brand/{brandId}")
    public ResponseEntity<ApiResponse<Long>> getProductCountByBrand(@PathVariable Long brandId) {
        ApiResponse<Long> response = new ApiResponse<>();
        try {
            if (brandId <= 0) {
                response.setCode(400);
                response.setMessage("ID thương hiệu không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            Long count = productService.countByBrand(brandId);
            response.setResult(count);
            response.setMessage("Lấy số lượng sản phẩm theo thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy số lượng sản phẩm theo thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/statistics/by-category/{categoryId}")
    public ResponseEntity<ApiResponse<Long>> getProductCountByCategory(@PathVariable Long categoryId) {
        ApiResponse<Long> response = new ApiResponse<>();
        try {
            if (categoryId <= 0) {
                response.setCode(400);
                response.setMessage("ID danh mục không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            Long count = productService.countByCategory(categoryId);
            response.setResult(count);
            response.setMessage("Lấy số lượng sản phẩm theo danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy số lượng sản phẩm theo danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    // ========== BUSINESS QUERIES ==========
    @GetMapping("/top-selling")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getTopSellingProducts(Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findTopSellingInStockProducts(pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm bán chạy thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm bán chạy: "  + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/high-rated")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getHighRatedProducts(
            @RequestParam(defaultValue = "4.0") BigDecimal minRating,
            Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findHighRatedProductsWithPagination(minRating, pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm đánh giá cao thành công");
            return ResponseEntity.ok(response);
        }  catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm đánh giá cao: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/newest")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewestProducts(Pageable pageable) {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findNewestProducts(pageable);
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm mới nhất thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm mới nhất: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getOutOfStockProducts() {
        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            List<Product> products = productService.findOutOfStockProducts();
            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();
            response.setResult(productResponses);
            response.setMessage("Lấy danh sách sản phẩm hết hàng thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách sản phẩm hết hàng: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }


    // ========== HELPER METHODS ==========
    private Pageable createSortedPageable(Pageable pageable, String sortBy) {
        // Thêm validation nếu null thì trả về trang hiện tại
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return pageable;
        }
        switch (sortBy) {
            case "id_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("id").descending()
                );
            case "id":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("id").ascending()
                );
            case "name_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("name").descending()
                );

            case "name":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("name").ascending()
                );
            case "price_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("price").descending()
                );
            case "price":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("price").ascending()
                );
            case "created_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").descending()
                );
            case "created":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").ascending()
                );
            case "stock_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("stock").descending()
                );
            case "stock":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("stock").ascending()
                );
            case "sold_desc":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("soldCount").descending()
                );
            case "sold":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("soldCount").ascending()
                );
            case "rating_desc":
                return  PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("averageRating").descending()
                );
            case "rating":
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("averageRating").ascending()
                );
            default:
                return PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by("createdDate").descending()
                );
        }
    }
}
