package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.service.IReviewService;

import java.util.List;

@RestController
@RequestMapping("/admin/reviews")
@CrossOrigin(origins = "*")
public class AdminReviewController {
    
    @Autowired
    private IReviewService reviewService;
    
    // ========== ADMIN REVIEW MANAGEMENT ==========
    
    /**
     * Lấy tất cả review (bao gồm cả ẩn) - Admin only
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ReviewResponse> reviewPage = reviewService.findAllReviewsForAdmin(pageable);
        return ResponseEntity.ok(reviewPage.getContent());
    }
    
    /**
     * Tìm kiếm review theo keyword - Admin only
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> searchReviews(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ReviewResponse> reviewPage = reviewService.searchReviewsByContent(keyword, pageable);
        return ResponseEntity.ok(reviewPage.getContent());
    }
    
    /**
     * Lấy review theo user ID - Admin only
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ReviewResponse> reviewPage = reviewService.findReviewsByUserForAdmin(userId, pageable);
        return ResponseEntity.ok(reviewPage.getContent());
    }
    
    /**
     * Lấy review theo product ID - Admin only
     */
    @GetMapping("/product/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ReviewResponse> reviewPage = reviewService.findReviewsByProductForAdmin(productId, pageable);
        return ResponseEntity.ok(reviewPage.getContent());
    }
    
    // ========== REVIEW VISIBILITY MANAGEMENT ==========
    
    /**
     * Toggle visibility của review - Admin only
     */
    @PutMapping("/{reviewId}/toggle-visibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> toggleReviewVisibility(@PathVariable Long reviewId) {
        ReviewResponse response = reviewService.toggleReviewVisibility(reviewId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Ẩn review - Admin only
     */
    @PutMapping("/{reviewId}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> hideReview(@PathVariable Long reviewId) {
        ReviewResponse response = reviewService.hideReview(reviewId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Hiện review - Admin only
     */
    @PutMapping("/{reviewId}/show")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> showReview(@PathVariable Long reviewId) {
        ReviewResponse response = reviewService.showReview(reviewId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Xóa review - Admin only
     */
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteById(reviewId);
        return ResponseEntity.noContent().build();
    }
}
