package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Order;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    List<Order> findByUserAndPaymentStatus(User user, Boolean paymentStatus);

    List<Order> findByPaymentStatus(Boolean paymentStatus);

    List<Order> findByOrderStatus(String orderStatus);

    List<Order> findByUserAndOrderStatus(User user, String orderStatus);

    List<Order> findByOrderDateBetween(LocalDateTime start, LocalDateTime end);

    Long countByPaymentStatus(Boolean paymentStatus);

    long countByUserAndPaymentStatus(User user, Boolean paymentStatus);

    long countByUser(User user);

    List<Order> findByUserOrderByOrderDateDesc(User user);

    List<Order> findByOrderByOrderDateDesc();

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.paymentStatus = true")
    BigDecimal getTotalRevenue();

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.user = :user AND o.paymentStatus = true")
    BigDecimal getTotalRevenueByUser(@Param("user") User user);












}
