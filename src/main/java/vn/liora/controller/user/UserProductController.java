package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.mapper.ProductMapper;
import vn.liora.repository.ImageRepository;
import vn.liora.service.IProductService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserProductController {

    private final IProductService productService;
    private final ProductMapper productMapper;
    private final ImageRepository imageRepository;

    // ========== PRODUCT SEARCH & FILTERING ==========
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam(required = false) String q, // search query
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir, // sort direction
            Pageable pageable) {
        ApiResponse<Page<ProductResponse>> response = new ApiResponse<>();
        try {
            Page<Product> products;

            // xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy, sortDir);
            }

            // tìm kiếm theo tên
            if (q != null && !q.trim().isEmpty()) {
                products = productService.findByNameContaining(q.trim(), pageable);
            } else {
                products = productService.findAll(pageable);
            }

            // lọc chỉ sản phẩm active và available
            List<Product> filteredProducts = products.getContent().stream()
                    .filter(product -> product.getIsActive() && product.getAvailable())
                    .toList();

            // lọc theo category
            if (categoryId != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> product.getCategory().getCategoryId().equals(categoryId))
                        .toList();
            }

            // lọc theo brand
            if (brandId != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> product.getBrand().getBrandId().equals(brandId))
                        .toList();
            }

            // lọc theo giá
            if (minPrice != null || maxPrice != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> {
                            BigDecimal price = product.getPrice();
                            if (minPrice != null && price.compareTo(minPrice) < 0) return false;
                            if (maxPrice != null && price.compareTo(maxPrice) > 0) return false;
                            return true;
                        })
                        .toList();
            }

            // lọc theo rating
            if (minRating != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(product -> product.getAverageRating() != null &&
                                product.getAverageRating().compareTo(minRating) >= 0)
                        .toList();
            }

            // tạo page từ filtered
            Page<Product> filteredPage = new PageImpl<>(
                    filteredProducts, pageable, filteredProducts.size()
            );

            Page<ProductResponse> productResponses = filteredPage.map(productMapper::toProductResponse);
            response.setResult(productResponses);
            response.setMessage("Tìm kiếm sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tìm kiếm sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== PRODUCT LISTING BY CATEGORY ==========
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            Pageable pageable) {

        ApiResponse<Page<ProductResponse>> response = new ApiResponse<>();
        try {
            if (categoryId <= 0) {
                response.setCode(400);
                response.setMessage("ID danh mục không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            // xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy, sortDir);
            }

            // lấy tất cả sản phẩm và filter
            // Lấy tất cả sản phẩm (không pagination)
            List<Product> allProducts = productService.findAll();
            
            // Filter tất cả sản phẩm
            List<Product> filteredProducts = allProducts.stream()
                    .filter(product -> product.getIsActive() && product.getAvailable())
                    .filter(product -> product.getCategory().getCategoryId().equals(categoryId))
                    .toList();

            Page<Product> filteredPage = new PageImpl<>(
                    filteredProducts, pageable, filteredProducts.size()
            );

            Page<ProductResponse> productResponses = filteredPage.map(productMapper::toProductResponse);
            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm theo danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm theo danh mục: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    // ========== PRODUCT LISTING BY BRAND ==========
    @GetMapping("/brand/{brandId}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProductsByBrand(
            @PathVariable Long brandId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            Pageable pageable) {

        ApiResponse<Page<ProductResponse>> response = new ApiResponse<>();
        try {
            if (brandId <= 0) {
                response.setCode(400);
                response.setMessage("ID thương hiệu không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            // xử lý sort
            if (sortBy != null && !sortBy.isEmpty()) {
                pageable = this.createSortedPageable(pageable, sortBy, sortDir);
            }

            // lấy tất cả sản phẩm và filter
            List<Product> allProducts = productService.findAll();
            List<Product> filteredProducts = allProducts.stream()
                .filter(product -> product.getIsActive() && product.getAvailable())
                .filter(product -> product.getBrand().getBrandId().equals(brandId))
                .toList();

            Page<Product> filteredPage = new PageImpl<>(
                    filteredProducts, pageable, filteredProducts.size()
            );

            Page<ProductResponse> productResponses = filteredPage.map(productMapper::toProductResponse);
            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm theo thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm theo thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // ========== PRODUCT DETAILS ==========
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ApiResponse<ProductResponse> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            ProductResponse productResponse = productService.findById(id);

            // Kiểm tra sản phẩm có active và available không
            if (!productResponse.getIsActive() || !productResponse.getAvailable()) {
                response.setCode(404);
                response.setMessage("Sản phẩm không khả dụng");
                return ResponseEntity.notFound().build();
            }

            response.setResult(productResponse);
            response.setMessage("Lấy thông tin sản phẩm thành công");
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy thông tin sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    // ========== FEATURED PRODUCTS ==========
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByFeatured(
            @RequestParam(defaultValue = "10") int limit) {

        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            // lấy sản phẩm bán chạy nhất (top selling)
            Pageable pageable = PageRequest.of(0, limit);
            List<Product> products = productService.findHighRatedProductsWithPagination(
                BigDecimal.valueOf(4.0), pageable);

            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();

            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm nổi bật thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm nổi bật: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== NEWEST PRODUCTS ==========
    @GetMapping("/newest")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewestProducts(
            @RequestParam(defaultValue = "10") int limit) {

        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Product> products = productService.findNewestProducts(pageable);

            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();

            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm mới nhất thành công");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm mới nhất: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== BEST SELLING PRODUCTS ==========
    @GetMapping("/best-selling")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {

        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Product> products = productService.findTopSellingInStockProducts(pageable);

            List<ProductResponse> productResponses = products.stream()
                    .map(productMapper::toProductResponse)
                    .toList();

            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm bán chạy thành công");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm bán chạy: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== PRODUCT IMAGES ==========
    // Lấy hình ảnh của sản phẩm
    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getProductImages(@PathVariable Long id) {
        ApiResponse<List<Map<String, String>>> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            // Kiểm tra sản phẩm có tồn tại không
            ProductResponse product = productService.findById(id);
            if (!product.getIsActive() || !product.getAvailable()) {
                response.setCode(404);
                response.setMessage("Sản phẩm không khả dụng");
                return ResponseEntity.notFound().build();
            }

            // Lấy danh sách hình ảnh
            List<Image> images = imageRepository.findByProductProductId(id);
            
            List<Map<String, String>> imageList = images.stream()
                    .map(image -> {
                        Map<String, String> imageInfo = new HashMap<>();
                        imageInfo.put("imageId", image.getImageId().toString());
                        imageInfo.put("imageUrl", image.getImageUrl());
                        imageInfo.put("thumbnailUrl", image.getImageUrl().replace("/uploads/products/", "/uploads/products/thumbnails/"));
                        return imageInfo;
                    })
                    .toList();

            response.setResult(imageList);
            response.setMessage("Lấy hình ảnh sản phẩm thành công");
            return ResponseEntity.ok(response);

        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy hình ảnh sản phẩm: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== PRODUCT RECOMMENDATIONS ==========
    // 1. Similar products - sản phẩm tương tự
    @GetMapping("/{id}/similar")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getSimilarProducts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit) {

        ApiResponse<List<ProductResponse>> response = new ApiResponse<>();
        try {
            if (id <= 0) {
                response.setCode(400);
                response.setMessage("ID sản phẩm không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }

            // Lấy thông tin sản phẩm gốc
            ProductResponse originalProduct = productService.findById(id);

            // Kiểm tra sản phẩm có active và available không
            if (!originalProduct.getIsActive() || !originalProduct.getAvailable()) {
                response.setCode(404);
                response.setMessage("Sản phẩm không khả dụng");
                return ResponseEntity.notFound().build();
            }

            // Lấy tất cả sản phẩm để filter
            List<Product> allProducts = productService.findAll();

            // Filter sản phẩm tương tự
            List<Product> similarProducts = allProducts.stream()
                    .filter(product -> product.getIsActive() && product.getAvailable())
                    .filter(product -> !product.getProductId().equals(id)) // Loại trừ chính sản phẩm đó
                    .filter(product -> {
                        // Cùng category
                        if (!product.getCategory().getCategoryId().equals(originalProduct.getCategoryId())) {
                            return false;
                        }

                        // Cùng brand (nếu có)
                        if (originalProduct.getBrandId() != null && product.getBrand() != null) {
                            if (!product.getBrand().getBrandId().equals(originalProduct.getBrandId())) {
                                return false;
                            }
                        }

                        // Giá trong khoảng ±20% của sản phẩm gốc
                        BigDecimal originalPrice = originalProduct.getPrice();
                        BigDecimal minPrice = originalPrice.multiply(BigDecimal.valueOf(0.8));
                        BigDecimal maxPrice = originalPrice.multiply(BigDecimal.valueOf(1.2));

                        return product.getPrice().compareTo(minPrice) >= 0 &&
                                product.getPrice().compareTo(maxPrice) <= 0;
                    })
                    .sorted((p1, p2) -> {
                        // Sắp xếp theo rating giảm dần, sau đó theo price gần nhất
                        int ratingCompare = p2.getAverageRating().compareTo(p1.getAverageRating());
                        if (ratingCompare != 0) return ratingCompare;

                        BigDecimal priceDiff1 = p1.getPrice().subtract(originalProduct.getPrice()).abs();
                        BigDecimal priceDiff2 = p2.getPrice().subtract(originalProduct.getPrice()).abs();
                        return priceDiff1.compareTo(priceDiff2);
                    })
                    .limit(limit)
                    .toList();

            List<ProductResponse> productResponses = similarProducts.stream()
                    .map(productMapper::toProductResponse)
                    .toList();

            response.setResult(productResponses);
            response.setMessage("Lấy sản phẩm tương tự thành công");
            return ResponseEntity.ok(response);

        } catch (AppException e) {
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return ResponseEntity.status(e.getErrorCode().getCode()).body(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy sản phẩm tương tự: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }





    // ========== HELPER METHODS ==========
    private Pageable createSortedPageable(Pageable pageable, String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return pageable;
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // Tạo Pageable mới với sort mới (không merge với pageable gốc)
        return PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(direction, getSortField(sortBy))
        );
    }

    private String getSortField(String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "name": return "name";
            case "price": return "price";
            case "rating": return "averageRating";
            case "created": return "createdDate";
            case "sold": return "soldCount";
            case "stock": return "stock";
            default: return "createdDate";
        }
    }
}
