package vn.liora.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.service.IReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private IReviewService reviewService;

    @Autowired
    private UserRepository userRepository;

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Lấy review theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        ReviewResponse response = reviewService.findById(id);
        return ResponseEntity.ok(response);
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
}
