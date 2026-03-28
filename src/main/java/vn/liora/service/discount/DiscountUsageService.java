package vn.liora.service.discount;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Discount;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.DiscountRepository;

@Service
@RequiredArgsConstructor
public class DiscountUsageService {
    private final DiscountRepository discountRepository;

    @Transactional
    public void confirmUsage(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        int currentUsedCount = discount.getUsedCount() != null ? discount.getUsedCount() : 0;
        discount.setUsedCount(currentUsedCount + 1);
        discountRepository.save(discount);
    }

    @Transactional
    public void rollbackUsage(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        rollbackUsage(discount);
    }

    @Transactional
    public void rollbackUsage(Discount discount) {
        int currentUsedCount = discount.getUsedCount() != null ? discount.getUsedCount() : 0;
        if (currentUsedCount > 0) {
            discount.setUsedCount(currentUsedCount - 1);
            discountRepository.save(discount);
        }
    }
}
