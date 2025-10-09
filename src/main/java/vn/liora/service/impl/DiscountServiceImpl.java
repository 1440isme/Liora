package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.ApplyDiscountRequest;
import vn.liora.dto.request.DiscountCreationRequest;
import vn.liora.dto.request.DiscountUpdateRequest;
import vn.liora.dto.response.DiscountResponse;
import vn.liora.entity.Discount;
import vn.liora.entity.Order;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.DiscountMapper;
import vn.liora.repository.DiscountRepository;
import vn.liora.repository.OrderRepository;
import vn.liora.service.IDiscountService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DiscountServiceImpl implements IDiscountService {
    
    @Autowired
    private DiscountRepository discountRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private DiscountMapper discountMapper;
    
    // ========== BASIC CRUD ==========
    @Override
    public Discount createDiscount(DiscountCreationRequest request) {
        try {
            System.out.println("=== START CREATE DISCOUNT ===");
            
            // Check if discount name already exists
            if (existsByName(request.getName())) {
                throw new AppException(ErrorCode.DISCOUNT_NAME_ALREADY_EXISTS);
            }
            
            // Validate dates
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new AppException(ErrorCode.INVALID_DATE_RANGE);
            }
            
            Discount discount = discountMapper.toDiscount(request);
            discount.setCreatedAt(LocalDateTime.now());
            discount.setUpdatedAt(LocalDateTime.now());
            
            Discount savedDiscount = discountRepository.save(discount);
            System.out.println("Discount created: " + savedDiscount.getDiscountId());
            System.out.println("=== END CREATE DISCOUNT ===");
            
            return savedDiscount;
        } catch (Exception e) {
            System.out.println("CREATE DISCOUNT ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
        
        // Check name uniqueness if name is being updated
        if (request.getName() != null && !request.getName().equals(discount.getName())) {
            if (existsByName(request.getName())) {
                throw new AppException(ErrorCode.DISCOUNT_NAME_ALREADY_EXISTS);
            }
        }
        
        discountMapper.updateDiscount(discount, request);
        discount.setUpdatedAt(LocalDateTime.now());
        
        Discount updatedDiscount = discountRepository.save(discount);
        return discountMapper.toDiscountResponse(updatedDiscount);
    }
    
    @Override
    public void deleteById(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new AppException(ErrorCode.DISCOUNT_NOT_FOUND);
        }
        discountRepository.deleteById(id);
    }
    
    @Override
    public long count() {
        return discountRepository.count();
    }
    
    // ========== FIND ALL ==========
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
    
    // ========== BASIC SEARCH ==========
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
    
    
    // ========== BY STATUS ==========
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
    
    // ========== BY DATE RANGE ==========
    @Override
    public List<Discount> findActiveNow() {
        return discountRepository.findActiveNow(LocalDateTime.now());
    }
    
    @Override
    public Page<Discount> findActiveNow(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return discountRepository.findActiveNow(now, pageable);
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
    
    // ========== COUNT QUERIES ==========
    @Override
    public Long countActiveDiscounts() {
        return discountRepository.countByIsActiveTrue();
    }
    
    @Override
    public Long countInactiveDiscounts() {
        return discountRepository.countByIsActiveFalse();
    }
    
    
    // ========== BUSINESS LOGIC ==========
    @Override
    public List<Discount> findAvailableDiscounts() {
        return discountRepository.findAvailableDiscounts(LocalDateTime.now());
    }
    
    @Override
    public List<Discount> findAvailableDiscountsForOrder(BigDecimal orderTotal) {
        List<Discount> availableDiscounts = findAvailableDiscounts();
        return availableDiscounts.stream()
                .filter(discount -> orderTotal.compareTo(discount.getMinOrderValue() != null ? 
                        discount.getMinOrderValue() : BigDecimal.ZERO) >= 0)
                .toList();
    }
    
    @Override
    public BigDecimal calculateDiscountAmount(Long discountId, BigDecimal orderTotal) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        // Check minimum order value
        if (discount.getMinOrderValue() != null && orderTotal.compareTo(discount.getMinOrderValue()) < 0) {
            return BigDecimal.ZERO;
        }
        
        // Calculate discount based on type
        BigDecimal discountAmount;
        if ("PERCENTAGE".equals(discount.getDiscountType())) {
            // Calculate percentage discount
            discountAmount = orderTotal.multiply(discount.getDiscountValue()).divide(new BigDecimal("100"));
            
            // Apply maximum discount if set
            if (discount.getMaxDiscountAmount() != null && discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
                discountAmount = discount.getMaxDiscountAmount();
            }
        } else if ("FIXED_AMOUNT".equals(discount.getDiscountType())) {
            // Fixed amount discount
            discountAmount = discount.getDiscountValue();
            
            // Don't exceed order total
            if (discountAmount.compareTo(orderTotal) > 0) {
                discountAmount = orderTotal;
            }
        } else {
            // Default to percentage if type is unknown
            discountAmount = orderTotal.multiply(discount.getDiscountValue()).divide(new BigDecimal("100"));
        }
        
        return discountAmount;
    }
    
    @Override
    public boolean canApplyDiscount(Long discountId, Long userId, BigDecimal orderTotal) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        // Check if discount is active
        if (!isDiscountActive(discountId)) {
            return false;
        }
        
        // Check usage limits
        if (hasReachedUsageLimit(discountId)) {
            return false;
        }
        
        if (hasReachedUserUsageLimit(discountId, userId)) {
            return false;
        }
        
        // Check minimum order value
        if (discount.getMinOrderValue() != null && orderTotal.compareTo(discount.getMinOrderValue()) < 0) {
            return false;
        }
        
        return true;
    }
    
    // ========== ORDER DISCOUNT MANAGEMENT ==========
    @Override
    public void applyDiscountToOrder(ApplyDiscountRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        
        Discount discount = discountRepository.findById(request.getDiscountId())
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        // Check if discount can be applied
        if (!canApplyDiscount(request.getDiscountId(), order.getUser().getUserId(), order.getTotal())) {
            throw new AppException(ErrorCode.DISCOUNT_CANNOT_BE_APPLIED);
        }
        
        // Add discount to order (One-to-Many relationship)
        order.setDiscountId(request.getDiscountId());
        order.setDiscount(discount);
        orderRepository.save(order);
        
        // Increment usage count
        discount.setUsedCount(discount.getUsedCount() + 1);
        discountRepository.save(discount);
    }
    
    @Override
    public void removeDiscountFromOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        // Remove discount from order
        order.setDiscountId(null);
        order.setDiscount(null);
        orderRepository.save(order);
        
        // Decrement usage count
        if (discount.getUsedCount() > 0) {
            discount.setUsedCount(discount.getUsedCount() - 1);
            discountRepository.save(discount);
        }
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
    
    // ========== VALIDATION ==========
    @Override
    public boolean isDiscountActive(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        LocalDateTime now = LocalDateTime.now();
        return discount.getIsActive() && 
               now.isAfter(discount.getStartDate()) && 
               now.isBefore(discount.getEndDate());
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
        
        return discount.getUsageLimit() != null && 
               discount.getUsedCount() >= discount.getUsageLimit();
    }
    
    @Override
    public boolean hasReachedUserUsageLimit(Long discountId, Long userId) {
        // This would need to be implemented based on your usage tracking logic
        // For now, return false as a placeholder
        return false;
    }
    
    // ========== STATISTICS ==========
    @Override
    public Long getTotalUsageCount(Long discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_FOUND));
        
        return discount.getUsedCount().longValue();
    }
    
    @Override
    public Long getUsageCountByUser(Long discountId, Long userId) {
        // This would need to be implemented based on your usage tracking logic
        return 0L;
    }
    
    @Override
    public BigDecimal getTotalDiscountAmount(Long discountId) {
        // This would need to be implemented based on your usage tracking logic
        return BigDecimal.ZERO;
    }
}
