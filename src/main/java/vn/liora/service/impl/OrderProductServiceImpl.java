package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.repository.OrderProductRepository;
import vn.liora.service.IOrderProductService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderProductServiceImpl implements IOrderProductService {
    private final OrderProductRepository orderProductRepository;


    @Override
    public List<Object[]> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return orderProductRepository.getRevenueByCategory(startDate, endDate);
    }

    @Override
    public List<Object[]> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate) {
        return orderProductRepository.getRevenueByBrand(startDate, endDate);
    }
}
