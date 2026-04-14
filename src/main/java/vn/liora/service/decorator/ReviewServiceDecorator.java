package vn.liora.service.decorator;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.Review;
import vn.liora.service.IReviewService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public abstract class ReviewServiceDecorator implements IReviewService {
    protected final IReviewService delegate;

    protected ReviewServiceDecorator(IReviewService delegate) {
        this.delegate = delegate;
    }

    @Override
    public ReviewResponse createReview(ReviewCreationRequest request, Long userId) {
        return delegate.createReview(request, userId);
    }

    @Override
    public ReviewResponse findById(Long id) {
        return delegate.findById(id);
    }

    @Override
    public ReviewResponse updateReview(Long id, ReviewUpdateRequest request) {
        return delegate.updateReview(id, request);
    }

    @Override
    public void deleteById(Long id) {
        delegate.deleteById(id);
    }

    @Override
    public long count() {
        return delegate.count();
    }

    @Override
    public List<Review> findAll() {
        return delegate.findAll();
    }

    @Override
    public Page<Review> findAll(Pageable pageable) {
        return delegate.findAll(pageable);
    }

    @Override
    public List<ReviewResponse> findAllAsResponse() {
        return delegate.findAllAsResponse();
    }

    @Override
    public Page<ReviewResponse> findAllAsResponse(Pageable pageable) {
        return delegate.findAllAsResponse(pageable);
    }

    @Override
    public List<ReviewResponse> findVisibleReviewsByProductId(Long productId) {
        return delegate.findVisibleReviewsByProductId(productId);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByProductId(Long productId, Pageable pageable) {
        return delegate.findVisibleReviewsByProductId(productId, pageable);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable) {
        return delegate.findVisibleReviewsByProductIdWithRating(productId, rating, pageable);
    }

    @Override
    public List<ReviewResponse> findReviewsByProductId(Long productId) {
        return delegate.findReviewsByProductId(productId);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductId(Long productId, Pageable pageable) {
        return delegate.findReviewsByProductId(productId, pageable);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductIdWithRating(Long productId, Integer rating, Pageable pageable) {
        return delegate.findReviewsByProductIdWithRating(productId, rating, pageable);
    }

    @Override
    public List<ReviewResponse> findByUserId(Long userId) {
        return delegate.findByUserId(userId);
    }

    @Override
    public Page<ReviewResponse> findByUserId(Long userId, Pageable pageable) {
        return delegate.findByUserId(userId, pageable);
    }

    @Override
    public List<ReviewResponse> findVisibleReviewsByUserId(Long userId) {
        return delegate.findVisibleReviewsByUserId(userId);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByUserId(Long userId, Pageable pageable) {
        return delegate.findVisibleReviewsByUserId(userId, pageable);
    }

    @Override
    public Optional<Review> findByOrderItemId(Long orderItemId) {
        return delegate.findByOrderItemId(orderItemId);
    }

    @Override
    public boolean existsByOrderItemId(Long orderItemId) {
        return delegate.existsByOrderItemId(orderItemId);
    }

    @Override
    public Double getAverageRatingByProductId(Long productId) {
        return delegate.getAverageRatingByProductId(productId);
    }

    @Override
    public Long getReviewCountByProductId(Long productId) {
        return delegate.getReviewCountByProductId(productId);
    }

    @Override
    public Long getTotalReviewCountByProductId(Long productId) {
        return delegate.getTotalReviewCountByProductId(productId);
    }

    @Override
    public Map<String, Object> getProductReviewStatistics(Long productId) {
        return delegate.getProductReviewStatistics(productId);
    }

    @Override
    public Map<String, Object> getMultipleProductsReviewStatistics(List<Long> productIds) {
        return delegate.getMultipleProductsReviewStatistics(productIds);
    }

    @Override
    public List<ReviewResponse> findAllReviewsForAdmin() {
        return delegate.findAllReviewsForAdmin();
    }

    @Override
    public Page<ReviewResponse> findAllReviewsForAdmin(Pageable pageable) {
        return delegate.findAllReviewsForAdmin(pageable);
    }

    @Override
    public List<ReviewResponse> searchReviewsByContent(String keyword) {
        return delegate.searchReviewsByContent(keyword);
    }

    @Override
    public Page<ReviewResponse> searchReviewsByContent(String keyword, Pageable pageable) {
        return delegate.searchReviewsByContent(keyword, pageable);
    }

    @Override
    public List<ReviewResponse> findReviewsByUserForAdmin(Long userId) {
        return delegate.findReviewsByUserForAdmin(userId);
    }

    @Override
    public Page<ReviewResponse> findReviewsByUserForAdmin(Long userId, Pageable pageable) {
        return delegate.findReviewsByUserForAdmin(userId, pageable);
    }

    @Override
    public List<ReviewResponse> findReviewsByProductForAdmin(Long productId) {
        return delegate.findReviewsByProductForAdmin(productId);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductForAdmin(Long productId, Pageable pageable) {
        return delegate.findReviewsByProductForAdmin(productId, pageable);
    }

    @Override
    public ReviewResponse toggleReviewVisibility(Long reviewId) {
        return delegate.toggleReviewVisibility(reviewId);
    }

    @Override
    public ReviewResponse hideReview(Long reviewId) {
        return delegate.hideReview(reviewId);
    }

    @Override
    public ReviewResponse showReview(Long reviewId) {
        return delegate.showReview(reviewId);
    }

    @Override
    public Page<ReviewResponse> findAllReviewsForAdminWithFilters(
            Pageable pageable,
            String search,
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId,
            Boolean isVisible) {
        return delegate.findAllReviewsForAdminWithFilters(pageable, search, rating, brandId, categoryId, productId, isVisible);
    }

    @Override
    public Map<String, Object> getReviewStatistics(
            Integer rating,
            Long brandId,
            Long categoryId,
            Long productId) {
        return delegate.getReviewStatistics(rating, brandId, categoryId, productId);
    }

    @Override
    public List<Map<String, Object>> getBrandsForFilter() {
        return delegate.getBrandsForFilter();
    }

    @Override
    public List<Map<String, Object>> getCategoriesForFilter() {
        return delegate.getCategoriesForFilter();
    }

    @Override
    public List<Map<String, Object>> getProductsForFilter(Long brandId, Long categoryId) {
        return delegate.getProductsForFilter(brandId, categoryId);
    }

    @Override
    public void updateReviewVisibility(Long reviewId, Boolean isVisible) {
        delegate.updateReviewVisibility(reviewId, isVisible);
    }

    @Override
    public boolean existsByOrderItemIdAndUserId(Long orderItemId, Long userId) {
        return delegate.existsByOrderItemIdAndUserId(orderItemId, userId);
    }

    @Override
    public ReviewResponse findByOrderItemIdAndUserId(Long orderItemId, Long userId) {
        return delegate.findByOrderItemIdAndUserId(orderItemId, userId);
    }
}
