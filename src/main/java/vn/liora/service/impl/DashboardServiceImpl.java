package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.LowStockProductResponse;
import vn.liora.dto.response.RecentOrderResponse;
import vn.liora.dto.response.TopCustomerResponse;
import vn.liora.dto.response.TopProductResponse;
import vn.liora.entity.Order;
import vn.liora.service.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class DashboardServiceImpl implements IDashboardService {
    @Autowired
    private IOrderService orderService;
    @Autowired
    private IProductService productService;
    @Autowired
    private IUserService userService;
    @Autowired
    private IOrderProductService orderProductService;

    @Override
    public BigDecimal getTotalRevenue() {
        return orderService.getTotalRevenueCompleted();
    }

    @Override
    public long getTotalOrders() {
        return orderService.getOrdersByOrderStatus("COMPLETED").size() + orderService.getOrdersByOrderStatus("PENDING").size() +
               orderService.getOrdersByOrderStatus("CONFIRMED").size() + orderService.getOrdersByOrderStatus("CANCELLED").size();
    }

    @Override
    public long getTotalProducts() {
        return productService.count();
    }

    @Override
    public long getTotalCustomers() {
        return userService.count() - 1; // Trừ 1 tài khoản admin
    }

    @Override
    public long getPendingOrders() {
        return orderService.getOrdersByOrderStatus("PENDING").size();
    }

    @Override
    public long getLowStockProducts() {
        // Chỉ đếm sản phẩm sắp hết hàng (1-10), không bao gồm sản phẩm đã hết hàng (stock = 0)
        return productService.findByStockLessThanEqual(10).stream()
                .filter(p -> p.getStock() > 0)
                .count();
    }

    @Override
    public BigDecimal getTodayRevenue() {
        return orderService.getRevenueByDate(LocalDate.now());
    }

    @Override
    public double getConversionRate() {
        // Đếm số khách hàng đã có ít nhất 1 đơn hàng COMPLETED
        long customersWhoOrdered = orderService.countCustomersWithCompletedOrders();
        
        // Tổng số khách hàng (trừ admin)
        long totalCustomers = userService.count() - 1;
        
        if (totalCustomers == 0) {
            return 0.0;
        }
        
        // Conversion Rate = (Số khách hàng đã mua / Tổng số khách hàng) × 100%
        return ((double) customersWhoOrdered / totalCustomers) * 100.0;
    }

    @Override
    public List<RecentOrderResponse> getRecentOrders(int limit) {
        // ✅ Gọi qua orderService để lấy danh sách đơn hàng mới nhất
        List<Order> recentOrders = orderService.getRecentOrders(limit);

        return recentOrders.stream()
                    .map(o -> {
                        String customerName;
                        if (o.getUser() != null) {
                            if (o.getUser().getLastname() != null) {
                                String firstname = o.getUser().getFirstname() != null ? o.getUser().getFirstname() + " " : "";
                                customerName = firstname + o.getUser().getLastname();
                            } else {
                                customerName = o.getUser().getUsername();
                            }
                        } else {
                            customerName = "Ẩn danh";
                        }
                        return RecentOrderResponse.builder()
                                .id(o.getIdOrder())
                                .customerName(customerName)
                                .totalAmount(Optional.ofNullable(o.getTotal()).orElse(BigDecimal.ZERO))
                                .status(o.getOrderStatus())
                                .paymentStatus(o.getPaymentStatus())
                                .createdAt(o.getOrderDate())
                                .build();
                    })
                    .collect(Collectors.toList());
    }

    @Override
    public List<TopProductResponse> getTopProducts(int limit) {
        return productService.getTopSellingProducts(limit);
    }

    @Override
    public List<LowStockProductResponse> getLowStockProductsList(int threshold) {
        return productService.findByStockLessThanEqual(threshold).stream()
                .filter(product -> product.getStock() > 0) // Chỉ lấy sản phẩm sắp hết hàng, không lấy sản phẩm đã hết hàng
                .map(product -> LowStockProductResponse.builder()
                        .productId(product.getProductId())
                        .name(product.getName())
                        .stock(product.getStock())
                        .categoryName(product.getCategory().getName())
                        .isActive(product.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Double> getRevenueByTime(String groupType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Object[]> results;
        Map<String, Double> data = new LinkedHashMap<>();

        switch (groupType.toLowerCase()) {
            case "month" -> {
                results = orderService.getRevenueByMonth(startDate, endDate);
                for (Object[] row : results)
                    data.put("Tháng " + row[0], ((Number) row[1]).doubleValue());
            }
            case "year" -> {
                results = orderService.getRevenueByYear(startDate, endDate);
                for (Object[] row : results)
                    data.put("Năm " + row[0], ((Number) row[1]).doubleValue());
            }
            default -> {
                results = orderService.getRevenueByDay(startDate, endDate);
                for (Object[] row : results)
                    data.put(row[0].toString(), ((Number) row[1]).doubleValue());
            }
        }
        return data;
    }

    @Override
    public Map<String, Double> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Double> data = new LinkedHashMap<>();
        List<Object[]> results = orderProductService.getRevenueByCategory(startDate, endDate);
        for (Object[] row : results)
            data.put((String) row[0], ((Number) row[1]).doubleValue());
        return data;
    }

    @Override
    public Map<String, Double> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Double> data = new LinkedHashMap<>();
        List<Object[]> results = orderProductService.getRevenueByBrand(startDate, endDate);
        for (Object[] row : results)
            data.put((String) row[0], ((Number) row[1]).doubleValue());
        return data;
    }

    @Override
    public long getNewCustomersThisMonth() {
        return userService.countNewCustomersThisMonth();
    }

    @Override
    public double getReturningCustomers() {
        long returningCustomers = orderService.countReturningCustomers();
        long totalCustomers = userService.count() - 1; // Trừ 1 tài khoản admin
        if (totalCustomers == 0) {
            return 0;
        }
        return ((double) returningCustomers / totalCustomers) * 100;
    }

    @Override
    public List<TopCustomerResponse> getTopCustomers(int limit) {
        return orderService.getTopSpenders(limit);
    }
    
    @Override
    public Map<String, Long> getNewCustomersByMonth() {
        Map<String, Long> result = new LinkedHashMap<>();
        
        // Lấy dữ liệu 12 tháng gần nhất
        LocalDateTime startDate = LocalDateTime.now().minusMonths(11).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Object[]> data = userService.getNewCustomersByMonth(startDate);
        
        // Tạo map đầy đủ 12 tháng (điền 0 cho tháng không có data)
        LocalDateTime current = LocalDateTime.now().minusMonths(11).withDayOfMonth(1);
        for (int i = 0; i < 12; i++) {
            String key = String.format("Tháng %d/%d", current.getMonthValue(), current.getYear());
            result.put(key, 0L);
            current = current.plusMonths(1);
        }
        
        // Điền data thực vào
        for (Object[] row : data) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            String key = String.format("Tháng %d/%d", month, year);
            result.put(key, count);
        }
        
        return result;
    }
}

