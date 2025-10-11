package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Review;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // ====== BASIC SEARCH ======
    List<Review> findByProductId(Long productId);
    Page<Review> findByProductId(Long productId, Pageable pageable);
    List<Review> findByUserId(Long userId);
    Page<Review> findByUserId(Long userId, Pageable pageable);
    
    // ====== BY ORDER PRODUCT (1-1) ======
    Optional<Review> findByOrderProduct_IdOrderProduct(Long idOrderProduct);
    boolean existsByOrderProduct_IdOrderProduct(Long idOrderProduct);
    
    // ====== FILTERS ======
    List<Review> findByRating(Integer rating);
    List<Review> findByRatingBetween(Integer minRating, Integer maxRating);
    List<Review> findByProductIdAndRating(Long productId, Integer rating);
    
    // ====== COUNT QUERIES ======
    Long countByProductId(Long productId);
    Long countByUserId(Long userId);
    Long countByRating(Integer rating);
    
    // ====== VISIBILITY FILTERS ======
    List<Review> findByProductIdAndIsVisibleTrue(Long productId);
    Page<Review> findByProductIdAndIsVisibleTrue(Long productId, Pageable pageable);
    long countByProductIdAndIsVisibleTrue(Long productId);
    
    // ====== CUSTOM QUERIES ======
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId")
    Long getReviewCountByProductId(@Param("productId") Long productId);
}