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
    @Query("SELECT COUNT(r) > 0 FROM Review r WHERE r.orderProduct.order.idOrder = :orderId")
    boolean existsByOrderId(@Param("orderId") Long orderId);
    
    // ====== VISIBILITY FILTERS ======
    List<Review> findByProductIdAndIsVisibleTrue(Long productId);
    Page<Review> findByProductIdAndIsVisibleTrue(Long productId, Pageable pageable);
    long countByProductIdAndIsVisibleTrue(Long productId);
    
    // User visibility filters
    List<Review> findByUserIdAndIsVisibleTrue(Long userId);
    Page<Review> findByUserIdAndIsVisibleTrue(Long userId, Pageable pageable);
    
    // ====== CUSTOM QUERIES ======
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId AND r.isVisible = true")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId AND r.isVisible = true")
    Long getReviewCountByProductId(@Param("productId") Long productId);
    
    // ====== ADMIN QUERIES ======
    // Tìm tất cả review (bao gồm cả ẩn) - không có ORDER BY để tránh conflict
    List<Review> findAll();
    Page<Review> findAll(Pageable pageable);
    
    // Tìm review theo nội dung (search) - không có ORDER BY để tránh conflict
    @Query("SELECT r FROM Review r WHERE LOWER(r.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Review> findByContentContainingIgnoreCase(@Param("keyword") String keyword);
    
    @Query("SELECT r FROM Review r WHERE LOWER(r.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Review> findByContentContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    // ====== ADMIN FILTER QUERIES ======
    @Query("SELECT r FROM Review r " +
            "JOIN r.orderProduct op " +
            "JOIN op.product p " +
            "WHERE (:search IS NULL OR LOWER(r.content) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "AND (:brandId IS NULL OR p.brand.brandId = :brandId) " +
            "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
            "AND (:productId IS NULL OR r.productId = :productId) " +
            "AND (:isVisible IS NULL OR r.isVisible = :isVisible)")
    Page<Review> findAllReviewsWithFilters(
            @Param("search") String search,
            @Param("rating") Integer rating,
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId,
            @Param("isVisible") Boolean isVisible,
            Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r " +
            "JOIN r.orderProduct op " +
            "JOIN op.product p " +
            "WHERE (:rating IS NULL OR r.rating = :rating) " +
            "AND (:brandId IS NULL OR p.brand.brandId = :brandId) " +
            "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
            "AND (:productId IS NULL OR r.productId = :productId)")
    Double getAverageRatingWithFilters(
            @Param("rating") Integer rating,
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r " +
            "JOIN r.orderProduct op " +
            "JOIN op.product p " +
            "WHERE (:rating IS NULL OR r.rating = :rating) " +
            "AND (:brandId IS NULL OR p.brand.brandId = :brandId) " +
            "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
            "AND (:productId IS NULL OR r.productId = :productId)")
    Long getReviewCountWithFilters(
            @Param("rating") Integer rating,
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r " +
            "JOIN r.orderProduct op " +
            "JOIN op.product p " +
            "WHERE r.rating = 5 " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "AND (:brandId IS NULL OR p.brand.brandId = :brandId) " +
            "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
            "AND (:productId IS NULL OR r.productId = :productId)")
    Long getFiveStarReviewCountWithFilters(
            @Param("rating") Integer rating,
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId);
}