package vn.liora.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IProductService;
import vn.liora.service.IReviewService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Value("${app.upload.path:uploads}")
    private String uploadPath;

    private static final long MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
    private static final long MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB - increased to allow larger videos
    private static final int MAX_IMAGES = 5;

    @Autowired
    private IReviewService reviewService;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private IProductService productService;

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Lấy review theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        ReviewResponse response = reviewService.findById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy đánh giá của sản phẩm với phân trang và lọc theo sao
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<Map<String, Object>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            // Lấy đánh giá (bao gồm cả ẩn để hiển thị với nội dung che)
            Page<ReviewResponse> reviews;
            if (rating != null && rating >= 1 && rating <= 5) {
                // Lọc theo rating cụ thể - lấy tất cả reviews (bao gồm ẩn)
                reviews = reviewService.findReviewsByProductIdWithRating(productId, rating, pageable);
            } else {
                // Lấy tất cả đánh giá (bao gồm cả ẩn)
                reviews = reviewService.findReviewsByProductId(productId, pageable);
            }
            
            // Lấy thống kê
            Map<String, Object> statistics = reviewService.getProductReviewStatistics(productId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reviews", reviews.getContent());
            response.put("totalElements", reviews.getTotalElements());
            response.put("totalPages", reviews.getTotalPages());
            response.put("currentPage", reviews.getNumber());
            response.put("size", reviews.getSize());
            response.put("statistics", statistics);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting product reviews: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể lấy đánh giá sản phẩm");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Lấy thống kê đánh giá sản phẩm
     */
    @GetMapping("/product/{productId}/statistics")
    public ResponseEntity<Map<String, Object>> getProductReviewStatistics(@PathVariable Long productId) {
        try {
            Map<String, Object> statistics = reviewService.getProductReviewStatistics(productId);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error getting product review statistics: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể lấy thống kê đánh giá");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Lấy thống kê đánh giá cho nhiều sản phẩm (để hiển thị trên product cards)
     */
    @PostMapping("/products/statistics")
    public ResponseEntity<Map<String, Object>> getMultipleProductsReviewStatistics(@RequestBody List<Long> productIds) {
        try {
            Map<String, Object> statistics = reviewService.getMultipleProductsReviewStatistics(productIds);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error getting multiple products review statistics: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể lấy thống kê đánh giá");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Cập nhật average rating cho tất cả sản phẩm (Admin endpoint)
     */
    @PostMapping("/admin/update-all-ratings")
    public ResponseEntity<Map<String, Object>> updateAllProductsAverageRating() {
        try {
            productService.updateAllProductsAverageRating();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đã cập nhật average rating cho tất cả sản phẩm");
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating all products average rating: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể cập nhật average rating");
            errorResponse.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ========== USER ENDPOINTS ==========

    /**
     * Tạo review mới
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewCreationRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        ReviewResponse response = reviewService.createReview(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Cập nhật review của mình
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ReviewResponse> updateMyReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewUpdateRequest request,
            Authentication authentication) {

        // TODO: Kiểm tra user có quyền sửa review này không
        ReviewResponse response = reviewService.updateReview(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa review của mình
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deleteMyReview(
            @PathVariable Long id,
            Authentication authentication) {

        // TODO: Kiểm tra user có quyền xóa review này không
        reviewService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy review của user hiện tại (chỉ review hiển thị)
     */
    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long userId = getUserIdFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Chỉ lấy review hiển thị của user
        Page<ReviewResponse> reviews = reviewService.findVisibleReviewsByUserId(userId, pageable);
        return ResponseEntity.ok(reviews.getContent());
    }

        /**
         * Kiểm tra xem orderProduct đã có review chưa
         */
        @GetMapping("/check/{orderProductId}")
        @PreAuthorize("hasRole('USER')")
        public ResponseEntity<Map<String, Object>> checkReviewExists(
                @PathVariable Long orderProductId,
                Authentication authentication) {
            
            Long userId = getUserIdFromAuthentication(authentication);
            
            try {
                boolean exists = reviewService.existsByOrderProductIdAndUserId(orderProductId, userId);
                Map<String, Object> response = new HashMap<>();
                response.put("exists", exists);
                
                if (exists) {
                    ReviewResponse review = reviewService.findByOrderProductIdAndUserId(orderProductId, userId);
                    response.put("review", review);
                }
                
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                log.error("Error checking review existence: {}", e.getMessage());
                Map<String, Object> response = new HashMap<>();
                response.put("exists", false);
                return ResponseEntity.ok(response);
            }
        }
    
    // ========== HELPER METHODS ==========

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }

        // Tìm user ID từ username hoặc email (fallback cho OAuth)
        User user = findUserByPrincipal(authentication);

        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return user.getUserId();
    }

    /**
     * Tìm user từ authentication, hỗ trợ cả JWT và OAuth2
     */
    private User findUserByPrincipal(Authentication authentication) {
        String principalName = authentication.getName();

        // 1. Thử tìm bằng username trước
        User user = userRepository.findByUsername(principalName).orElse(null);
        if (user != null) {
            return user;
        }

        // 2. Thử tìm bằng email nếu principal name chứa @
        if (principalName != null && principalName.contains("@")) {
            user = userRepository.findByEmail(principalName).orElse(null);
            if (user != null) {
                return user;
            }
        }

        // 3. Nếu là OAuth2 user, lấy user từ CustomOAuth2User
        if (authentication.getPrincipal() instanceof vn.liora.dto.CustomOAuth2User) {
            vn.liora.dto.CustomOAuth2User customOAuth2User = (vn.liora.dto.CustomOAuth2User) authentication
                    .getPrincipal();
            return customOAuth2User.getUser();
        }

        return null;
    }
    
    /**
     * Upload ảnh cho đánh giá sản phẩm
     */
    @PostMapping("/media/images")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> uploadReviewImages(@RequestParam("files") MultipartFile[] files) {
        Map<String, Object> response = new HashMap<>();
        List<String> uploadedUrls = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            // Kiểm tra số lượng file
            if (files.length > MAX_IMAGES) {
                response.put("success", false);
                response.put("message", "Chỉ được tải lên tối đa " + MAX_IMAGES + " ảnh");
                return ResponseEntity.badRequest().body(response);
            }

            for (MultipartFile file : files) {
                // Validate file
                if (file.isEmpty()) {
                    errors.add("File trống");
                    continue;
                }

                // Validate file type
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    errors.add("File " + file.getOriginalFilename() + " không phải là ảnh");
                    continue;
                }

                // Validate file size
                if (file.getSize() > MAX_IMAGE_SIZE) {
                    errors.add("File " + file.getOriginalFilename() + " vượt quá kích thước cho phép (1MB)");
                    continue;
                }

                // Generate unique filename
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }

                String uniqueFilename = UUID.randomUUID().toString() + extension;

                // Create directory structure: uploads/reviews/images/YYYY/MM/DD/
                LocalDateTime now = LocalDateTime.now();
                String year = String.valueOf(now.getYear());
                String month = String.format("%02d", now.getMonthValue());
                String day = String.format("%02d", now.getDayOfMonth());

                Path imageDir = Paths.get(uploadPath, "reviews", "images", year, month, day);
                Files.createDirectories(imageDir);

                // Save file
                Path filePath = imageDir.resolve(uniqueFilename);
                Files.copy(file.getInputStream(), filePath);

                // Generate URL
                String fileUrl = "/uploads/reviews/images/" + year + "/" + month + "/" + day + "/" + uniqueFilename;
                uploadedUrls.add(fileUrl);
            }

            response.put("success", true);
            response.put("message", "Upload thành công");
            response.put("imagePaths", uploadedUrls);
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Lỗi khi upload ảnh đánh giá: ", e);
            response.put("success", false);
            response.put("message", "Lỗi khi upload file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            log.error("Lỗi không xác định khi upload ảnh đánh giá: ", e);
            response.put("success", false);
            response.put("message", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Upload video cho đánh giá sản phẩm
     */
    @PostMapping("/media/video")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> uploadReviewVideo(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File không được để trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                response.put("success", false);
                response.put("message", "Chỉ được upload file video");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size
            if (file.getSize() > MAX_VIDEO_SIZE) {
                response.put("success", false);
                response.put("message", "Kích thước file không được vượt quá 10MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create directory structure: uploads/reviews/videos/YYYY/MM/DD/
            LocalDateTime now = LocalDateTime.now();
            String year = String.valueOf(now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String day = String.format("%02d", now.getDayOfMonth());

            Path videoDir = Paths.get(uploadPath, "reviews", "videos", year, month, day);
            Files.createDirectories(videoDir);

            // Save file
            Path filePath = videoDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            // Generate URL
            String fileUrl = "/uploads/reviews/videos/" + year + "/" + month + "/" + day + "/" + uniqueFilename;

            response.put("success", true);
            response.put("message", "Upload thành công");
            response.put("videoPath", fileUrl);
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Lỗi khi upload video đánh giá: ", e);
            response.put("success", false);
            response.put("message", "Lỗi khi upload file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            log.error("Lỗi không xác định khi upload video đánh giá: ", e);
            response.put("success", false);
            response.put("message", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
