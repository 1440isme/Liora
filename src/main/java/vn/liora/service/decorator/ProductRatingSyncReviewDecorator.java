package vn.liora.service.decorator;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.ReviewCreationRequest;
import vn.liora.dto.request.ReviewUpdateRequest;
import vn.liora.dto.response.ReviewResponse;
import vn.liora.service.IProductService;
import vn.liora.service.IReviewService;

@Service
@Primary
@Slf4j
public class ProductRatingSyncReviewDecorator extends ReviewServiceDecorator {
    private final IProductService productService;

    public ProductRatingSyncReviewDecorator(
            @Qualifier("reviewCoreService") IReviewService delegate,
            IProductService productService) {
        super(delegate);
        this.productService = productService;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(ReviewCreationRequest request, Long userId) {
        ReviewResponse response = super.createReview(request, userId);
        syncProductRating(response.getProductId());
        return response;
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, ReviewUpdateRequest request) {
        ReviewResponse response = super.updateReview(id, request);
        syncProductRating(response.getProductId());
        return response;
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        ReviewResponse review = super.findById(id);
        super.deleteById(id);
        syncProductRating(review.getProductId());
    }

    private void syncProductRating(Long productId) {
        try {
            productService.updateProductAverageRating(productId);
        } catch (Exception e) {
            log.error("Error updating product average rating for product {}: {}", productId, e.getMessage());
        }
    }
}
