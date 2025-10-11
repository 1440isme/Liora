package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.Product;
import vn.liora.entity.Review;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderProductRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.repository.ReviewRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IReviewService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewServiceImpl implements IReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderProductRepository orderProductRepository;
    
    
    // ========== BASIC CRUD ==========
    @Override
    public Review createReview(ReviewCreationRequest request) {
        try {
            System.out.println("=== START CREATE REVIEW ===");
            
            // Validate user exists
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            System.out.println("User OK: " + user.getUsername());
            
            // Validate product exists
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            System.out.println("Product OK: " + product.getName());
            
            // Validate order product exists
            OrderProduct orderProduct = orderProductRepository.findById(request.getOrderProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));
            System.out.println("OrderProduct OK: " + orderProduct.getIdOrderProduct());
            
            // Check if user can review this product
            if (!canUserReviewProduct(request.getUserId(), request.getProductId(), request.getOrderProductId())) {
                throw new AppException(ErrorCode.REVIEW_NOT_ALLOWED);
            }
            
            // Check if review already exists for this order product (1-1 relationship)
            if (existsByOrderProductId(request.getOrderProductId())) {
                throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
            }
            
            // Create review
            Review review = new Review();
//            review.setTitle(request.getTitle());
            review.setContent(request.getContent());
            review.setRating(request.getRating());
            review.setAnonymous(request.getAnonymous() != null ? request.getAnonymous() : false);
            review.setUserId(request.getUserId());
            review.setProductId(request.getProductId());
            review.setOrderProduct(orderProduct);
            review.setCreatedAt(LocalDateTime.now());
            review.setLastUpdate(LocalDateTime.now());
            
            Review savedReview = reviewRepository.save(review);
            System.out.println("Review created: " + savedReview.getReviewId());
            System.out.println("=== END CREATE REVIEW ===");
            
            return savedReview;
        } catch (Exception e) {
            System.out.println("CREATE REVIEW ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @Override
    public ReviewResponse findById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        return toReviewResponse(review);
    }
    
    @Override
    public ReviewResponse updateReview(Long id, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        // Update fields manually
//        if (request.getTitle() != null) {
//            review.setTitle(request.getTitle());
//        }
        if (request.getContent() != null) {
            review.setContent(request.getContent());
        }
        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }
        if (request.getAnonymous() != null) {
            review.setAnonymous(request.getAnonymous());
        }
        
        review.setLastUpdate(LocalDateTime.now());
        
        Review updatedReview = reviewRepository.save(review);
        return toReviewResponse(updatedReview);
    }
    
    @Override
    public void deleteById(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new AppException(ErrorCode.REVIEW_NOT_FOUND);
        }
        reviewRepository.deleteById(id);
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
    public Optional<Review> findByIdOptional(Long id) {
        return reviewRepository.findById(id);
    }
    
    // ========== BY PRODUCT ==========
    @Override
    public List<Review> findByProductId(Long productId) {
        return reviewRepository.findByProductId(productId);
    }
    
    @Override
    public Page<Review> findByProductId(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable);
    }
    
    @Override
    public List<Review> findByProductIdAndRating(Long productId, Integer rating) {
        return reviewRepository.findByProductIdAndRating(productId, rating);
    }
    
    // ========== BY USER ==========
    @Override
    public List<Review> findByUserId(Long userId) {
        return reviewRepository.findByUserId(userId);
    }
    
    @Override
    public Page<Review> findByUserId(Long userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable);
    }
    
    
    // ========== BY ORDER PRODUCT (1-1) ==========
    @Override
    public Optional<Review> findByOrderProductId(Long orderProductId) {
        return reviewRepository.findByOrderProduct_IdOrderProduct(orderProductId);
    }
    
    @Override
    public boolean existsByOrderProductId(Long orderProductId) {
        return reviewRepository.existsByOrderProduct_IdOrderProduct(orderProductId);
    }
    
    // ========== FILTERS ==========
    @Override
    public List<Review> findByRating(Integer rating) {
        return reviewRepository.findByRating(rating);
    }
    
    @Override
    public List<Review> findByRatingBetween(Integer minRating, Integer maxRating) {
        return reviewRepository.findByRatingBetween(minRating, maxRating);
    }
    
    // ========== COUNT QUERIES ==========
    @Override
    public Long countByProductId(Long productId) {
        return reviewRepository.countByProductId(productId);
    }
    
    @Override
    public Long countByUserId(Long userId) {
        return reviewRepository.countByUserId(userId);
    }
    
    
    @Override
    public Long countByRating(Integer rating) {
        return reviewRepository.countByRating(rating);
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
    
    // ========== HELPER METHODS ==========
    private ReviewResponse toReviewResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setReviewId(review.getReviewId());
//        response.setTitle(review.getTitle());
        response.setContent(review.getContent());
        response.setRating(review.getRating());
        response.setAnonymous(review.getAnonymous());
        response.setCreatedAt(review.getCreatedAt());
        response.setLastUpdate(review.getLastUpdate());
        response.setUserId(review.getUserId());
        response.setProductId(review.getProductId());
        
        // Set additional info if orderProduct is loaded
        if (review.getOrderProduct() != null) {
            response.setOrderProductId(review.getOrderProduct().getIdOrderProduct());
            
            // Set user info if available
            if (review.getOrderProduct().getOrder() != null && 
                review.getOrderProduct().getOrder().getUser() != null) {
                response.setUserFirstname(review.getOrderProduct().getOrder().getUser().getFirstname());
                response.setUserLastname(review.getOrderProduct().getOrder().getUser().getLastname());
                response.setUserAvatar(review.getOrderProduct().getOrder().getUser().getAvatar());
            }
            
            // Set product info if available
            if (review.getOrderProduct().getProduct() != null) {
                response.setProductName(review.getOrderProduct().getProduct().getName());
            }
        }
        
        return response;
    }
    
    // ========== VALIDATION ==========
    @Override
    public boolean canUserReviewProduct(Long userId, Long productId, Long orderProductId) {
        // Check if user has purchased this product through this order product
        return hasUserPurchasedProduct(userId, productId);
    }
    
    @Override
    public boolean hasUserPurchasedProduct(Long userId, Long productId) {
        // This would need to be implemented based on your order logic
        // For now, return true as a placeholder
        return true;
    }
}