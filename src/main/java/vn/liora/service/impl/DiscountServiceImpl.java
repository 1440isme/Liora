package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.DiscountCreationRequest;
import vn.liora.dto.request.DiscountUpdateRequest;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.entity.Discount;
import vn.liora.entity.Order;
import vn.liora.enums.DiscountType;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.DiscountMapper;
import vn.liora.repository.DiscountRepository;
import vn.liora.repository.OrderRepository;
import vn.liora.service.IDiscountService;
import vn.liora.service.discount.DiscountApplicationResult;
import vn.liora.service.discount.DiscountApplicationService;
import vn.liora.service.discount.DiscountContext;
import vn.liora.service.discount.DiscountUsageService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiscountServiceImpl implements IDiscountService {
    private final DiscountRepository discountRepository;
    private final OrderRepository orderRepository;
    private final DiscountMapper discountMapper;
    private final DiscountApplicationService discountApplicationService;
    private final DiscountUsageService discountUsageService;

    @Override
    public Discount createDiscount(DiscountCreationRequest request) {
        if (existsByName(request.getName())) {
            throw new AppException(ErrorCode.DISCOUNT_NAME_ALREADY_EXISTS);
        }

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        Discount discount = discountMapper.toDiscount(request);
        if (discount.getDiscountType() == null) {
            discount.setDiscountType(DiscountType.PERCENTAGE);
        }
        discount.setCreatedAt(LocalDateTime.now());
        discount.setUpdatedAt(LocalDateTime.now());
        return discountRepository.save(discount);
    }

    @Override
    public DiscountResponse findById(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        return discountMapper.toDiscountResponse(discount);
    }

    @Override
    public DiscountResponse updateDiscount(Long id, DiscountUpdateRequest request) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));

        if (request.getName() != null && !request.getName().equals(discount.getName()) && existsByName(request.getName())) {
            throw new AppException(ErrorCode.DISCOUNT_NAME_ALREADY_EXISTS);
        }

        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getStartDate().isAfter(request.getEndDate())) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        discountMapper.updateDiscount(discount, request);
        if (discount.getDiscountType() == null) {
            discount.setDiscountType(DiscountType.PERCENTAGE);
        }
        discount.setUpdatedAt(LocalDateTime.now());

        Discount updatedDiscount = discountRepository.save(discount);
        return discountMapper.toDiscountResponse(updatedDiscount);
    }

    @Override
    public void deleteById(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new AppException(ErrorCode.DISCOUNT_NOT_FOUND);
        }

        if (orderRepository.countByDiscount_DiscountId(id) > 0) {
            throw new AppException(ErrorCode.DISCOUNT_HAS_ORDERS);
        }

        try {
            discountRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Cannot delete discount {} because it is still referenced", id, ex);
            throw new AppException(ErrorCode.DISCOUNT_HAS_ORDERS);
        }
    }

    @Override
    public long count() {
        return discountRepository.count();
    }

    @Override
    public List<Discount> findAll() {
        return discountRepository.findAll();
    }

    @Override
    public Page<Discount> findAll(Pageable pageable) {
        return discountRepository.findAll(pageable);
    }

    @Override
    public Optional<Discount> findByIdOptional(Long id) {
        return discountRepository.findById(id);
    }

    @Override
    public Optional<Discount> findByName(String name) {
        return discountRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return discountRepository.existsByName(name);
    }

    @Override
    public List<Discount> findByNameContaining(String name) {
        return discountRepository.findByNameContaining(name);
    }

    @Override
    public Page<Discount> findByNameContaining(String name, Pageable pageable) {
        return discountRepository.findByNameContaining(name, pageable);
    }

    @Override
    public List<Discount> findActiveDiscounts() {
        return discountRepository.findByIsActiveTrue();
    }

    @Override
    public List<Discount> findInactiveDiscounts() {
        return discountRepository.findByIsActiveFalse();
    }

    @Override
    public Page<Discount> findActiveDiscounts(Pageable pageable) {
        return discountRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Discount> findInactiveDiscounts(Pageable pageable) {
        return discountRepository.findByIsActiveFalse(pageable);
    }

    @Override
    public List<Discount> findActiveNow() {
        return discountRepository.findActiveNow(LocalDateTime.now());
    }

    @Override
    public Page<Discount> findActiveNow(Pageable pageable) {
        return discountRepository.findActiveNow(LocalDateTime.now(), pageable);
    }

    @Override
    public List<Discount> findByStartDateBetween(LocalDateTime start, LocalDateTime end) {
        return discountRepository.findByStartDateBetween(start, end);
    }

    @Override
    public List<Discount> findByEndDateBetween(LocalDateTime start, LocalDateTime end) {
        return discountRepository.findByEndDateBetween(start, end);
    }

    @Override
    public List<Discount> findExpiredDiscounts() {
        return discountRepository.findByEndDateBefore(LocalDateTime.now());
    }

    @Override
    public List<Discount> findUpcomingDiscounts() {
        return discountRepository.findByStartDateAfter(LocalDateTime.now());
    }

    @Override
    public Long countActiveDiscounts() {
        return discountRepository.countByIsActiveTrue();
    }

    @Override
    public Long countInactiveDiscounts() {
        return discountRepository.countByIsActiveFalse();
    }

    @Override
    public List<Discount> findAvailableDiscounts() {
        return discountRepository.findAvailableDiscounts(LocalDateTime.now());
    }

    @Override
    public List<Discount> findAvailableDiscountsForOrder(BigDecimal orderTotal) {
        DiscountContext context = baseContext(null, orderTotal);
        return findAvailableDiscounts().stream()
                .filter(discount -> discountApplicationService.apply(discount, context).isApplied())
                .toList();
    }

    @Override
    public BigDecimal calculateDiscountAmount(Long discountId, BigDecimal orderTotal) {
        DiscountApplicationResult result = discountApplicationService.apply(discountId, baseContext(null, orderTotal));
        return result.isApplied() ? result.getFinalDiscountAmount() : BigDecimal.ZERO;
    }

    @Override
    public boolean canApplyDiscount(Long discountId, Long userId, BigDecimal orderTotal) {
        return discountApplicationService.apply(discountId, baseContext(userId, orderTotal)).isApplied();
    }

    @Override
    public Discount findAvailableDiscountByCode(String discountCode) {
        return discountRepository.findAvailableDiscountByName(discountCode, LocalDateTime.now())
                .orElse(null);
    }

    @Override
    public List<Discount> getDiscountsByOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getDiscount() != null) {
            return List.of(order.getDiscount());
        }
        return List.of();
    }

    @Override
    public boolean isDiscountActive(Long discountId) {
        return discountRepository.findById(discountId)
                .map(discount -> Boolean.TRUE.equals(discount.getIsActive())
                        && !LocalDateTime.now().isBefore(discount.getStartDate())
                        && !LocalDateTime.now().isAfter(discount.getEndDate()))
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
    }

    @Override
    public boolean isDiscountExpired(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        return LocalDateTime.now().isAfter(discount.getEndDate());
    }

    @Override
    public boolean hasReachedUsageLimit(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        return discount.getUsageLimit() != null && discount.getUsedCount() >= discount.getUsageLimit();
    }

    @Override
    public boolean hasReachedUserUsageLimit(Long discountId, Long userId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        if (discount.getUserUsageLimit() == null || userId == null) {
            return false;
        }
        Long userUsageCount = orderRepository.countOrdersByUserAndDiscount(userId, discountId);
        return userUsageCount >= discount.getUserUsageLimit();
    }

    @Override
    public Long getTotalUsageCount(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        return discount.getUsedCount().longValue();
    }

    @Override
    public Long getUsageCountByUser(Long discountId, Long userId) {
        return orderRepository.countOrdersByUserAndDiscount(userId, discountId);
    }

    @Override
    public BigDecimal getTotalDiscountAmount(Long discountId) {
        return BigDecimal.ZERO;
    }

    @Override
    public void incrementUsageCount(Long discountId) {
        discountUsageService.confirmUsage(discountId);
    }

    private DiscountContext baseContext(Long userId, BigDecimal orderTotal) {
        return DiscountContext.builder()
                .userId(userId)
                .orderSubtotal(orderTotal)
                .shippingFee(BigDecimal.ZERO)
                .appliedAt(LocalDateTime.now())
                .build();
    }
}
