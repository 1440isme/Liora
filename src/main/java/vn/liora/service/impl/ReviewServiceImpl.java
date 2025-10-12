package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.Review;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.ReviewMapper;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.ReviewRepository;
import vn.liora.service.IReviewService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewServiceImpl implements IReviewService {

    ReviewRepository reviewRepository;
    OrderProductRepository orderProductRepository;
    ReviewMapper reviewMapper;

    // ========== BASIC CRUD ==========
    
    @Override
    @Transactional
    public ReviewResponse createReview(ReviewCreationRequest request, Long userId) {
        // Kiểm tra OrderProduct có tồn tại không
        OrderProduct orderProduct = orderProductRepository.findById(request.getOrderProductId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));

        // Kiểm tra user có phải là chủ sở hữu của order không
        if (!orderProduct.getOrder().getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.REVIEW_ACCESS_DENIED);
        }

        // Kiểm tra đã review chưa
        if (reviewRepository.existsByOrderProduct_IdOrderProduct(request.getOrderProductId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        // Tạo review entity
        Review review = reviewMapper.toReview(request);
        review.setOrderProduct(orderProduct);
        review.setUserId(userId);
        review.setProductId(orderProduct.getProduct().getProductId());
        review.setCreatedAt(LocalDateTime.now());
        review.setLastUpdate(LocalDateTime.now());
        review.setIsVisible(true);

        // Lưu review
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    public ReviewResponse findById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return reviewMapper.toReviewResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        reviewMapper.updateReview(review, request);
        review.setLastUpdate(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        reviewRepository.delete(review);
    }

    @Override
    public long count() {
        return reviewRepository.count();
    }

    // ========== FIND ALL ==========
    
    @Override
    public List<Review> findAll() {
        return reviewRepository.findAll();
    }

    @Override
    public Page<Review> findAll(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    @Override
    public List<ReviewResponse> findAllAsResponse() {
        return reviewMapper.toReviewResponseList(reviewRepository.findAll());
    }

    @Override
    public Page<ReviewResponse> findAllAsResponse(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAll(pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY PRODUCT ==========
    
    @Override
    public List<ReviewResponse> findVisibleReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsVisibleTrue(productId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByProductId(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductIdAndIsVisibleTrue(productId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY USER ==========
    
    @Override
    public List<ReviewResponse> findByUserId(Long userId) {
        List<Review> reviews = reviewRepository.findByUserId(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findByUserId(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserId(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findVisibleReviewsByUserId(Long userId) {
        List<Review> reviews = reviewRepository.findByUserIdAndIsVisibleTrue(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findVisibleReviewsByUserId(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserIdAndIsVisibleTrue(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    // ========== BY ORDER PRODUCT ==========
    
    @Override
    public Optional<Review> findByOrderProductId(Long orderProductId) {
        return reviewRepository.findByOrderProduct_IdOrderProduct(orderProductId);
    }

    @Override
    public boolean existsByOrderProductId(Long orderProductId) {
        return reviewRepository.existsByOrderProduct_IdOrderProduct(orderProductId);
    }

    // ========== STATISTICS ==========
    
    @Override
    public Double getAverageRatingByProductId(Long productId) {
        return reviewRepository.getAverageRatingByProductId(productId);
    }

    @Override
    public Long getReviewCountByProductId(Long productId) {
        return reviewRepository.getReviewCountByProductId(productId);
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    @Override
    public List<ReviewResponse> findAllReviewsForAdmin() {
        List<Review> reviews = reviewRepository.findAll();
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findAllReviewsForAdmin(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAll(pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> searchReviewsByContent(String keyword) {
        List<Review> reviews = reviewRepository.findByContentContainingIgnoreCase(keyword);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> searchReviewsByContent(String keyword, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByContentContainingIgnoreCase(keyword, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findReviewsByUserForAdmin(Long userId) {
        List<Review> reviews = reviewRepository.findByUserId(userId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findReviewsByUserForAdmin(Long userId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByUserId(userId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    public List<ReviewResponse> findReviewsByProductForAdmin(Long productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        return reviewMapper.toReviewResponseList(reviews);
    }

    @Override
    public Page<ReviewResponse> findReviewsByProductForAdmin(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);
        return reviews.map(reviewMapper::toReviewResponse);
    }

    @Override
    @Transactional
    public ReviewResponse toggleReviewVisibility(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(!review.getIsVisible());
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse hideReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(false);
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse showReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        review.setIsVisible(true);
        review.setLastUpdate(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return reviewMapper.toReviewResponse(savedReview);
    }
}
