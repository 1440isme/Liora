package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.repository.OrderItemRepository;
import vn.liora.service.IOrderItemService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemServiceImpl implements IOrderItemService {
    OrderItemRepository orderItemRepository;

    @Override
    public List<Object[]> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return orderItemRepository.getRevenueByCategory(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate) {
        return orderItemRepository.getRevenueByBrand(startDate, endDate);
    }

    @Override
    public List<Object[]> getTopSellingProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderItemRepository.getTopSellingProductsByDateRange(startDate, endDate);
    }

    @Override
    public long countSoldProductsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderItemRepository.countSoldProductsByDateRange(startDate, endDate);
    }

    @Override
    public long countSoldBrandsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderItemRepository.countSoldBrandsByDateRange(startDate, endDate);
    }
}
