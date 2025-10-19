package vn.liora.service;

import vn.liora.dto.response.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface IDashboardService {
    BigDecimal getTotalRevenue();
    long getTotalOrders();
    long getTotalProducts();
    long getTotalCustomers();
    long getPendingOrders();
    long getLowStockProducts();
    BigDecimal getTodayRevenue();
    double getConversionRate();

    List<RecentOrderResponse> getRecentOrders(int limit);
    List<TopProductResponse> getTopProducts(int limit);
    List<LowStockProductResponse> getLowStockProductsList(int threshold);

    Map<String, Double> getRevenueByTime(String type, LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Double> getRevenueByCategory(LocalDateTime startDate, LocalDateTime endDate);
    Map<String, Double> getRevenueByBrand(LocalDateTime startDate, LocalDateTime endDate);

    long getNewCustomersThisMonth();
    double getReturningCustomers();
    List<TopCustomerResponse> getTopCustomers(int limit);

}
