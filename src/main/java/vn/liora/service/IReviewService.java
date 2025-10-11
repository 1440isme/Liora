package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.Review;

import java.util.List;
import java.util.Optional;

public interface IReviewService {
    
    // ========== BASIC CRUD ==========
    Review createReview(ReviewCreationRequest request);
    ReviewResponse findById(Long id);
    ReviewResponse updateReview(Long id, ReviewUpdateRequest request);
    void deleteById(Long id);
    long count();
    
    // ========== FIND ALL ==========
    List<Review> findAll();
    Page<Review> findAll(Pageable pageable);
    Optional<Review> findByIdOptional(Long id);
    
    // ========== BY PRODUCT ==========
    List<Review> findByProductId(Long productId);
    Page<Review> findByProductId(Long productId, Pageable pageable);
    List<Review> findByProductIdAndRating(Long productId, Integer rating);
    
    // ========== BY USER ==========
    List<Review> findByUserId(Long userId);
    Page<Review> findByUserId(Long userId, Pageable pageable);
    
    // ========== BY ORDER PRODUCT (1-1) ==========
    Optional<Review> findByOrderProductId(Long orderProductId);
    boolean existsByOrderProductId(Long orderProductId);
    
    // ========== FILTERS ==========
    List<Review> findByRating(Integer rating);
    List<Review> findByRatingBetween(Integer minRating, Integer maxRating);
    
    // ========== COUNT QUERIES ==========
    Long countByProductId(Long productId);
    Long countByUserId(Long userId);
    Long countByRating(Integer rating);
    
    // ========== STATISTICS ==========
    Double getAverageRatingByProductId(Long productId);
    Long getReviewCountByProductId(Long productId);
    
    // ========== VALIDATION ==========
    boolean canUserReviewProduct(Long userId, Long productId, Long orderProductId);
    boolean hasUserPurchasedProduct(Long userId, Long productId);
}