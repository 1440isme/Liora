package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Order;
import vn.liora.entity.OrderItem;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);

    @Query("""
        SELECT c.name, COALESCE(SUM(p.price), 0)
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productItem pi
        JOIN pi.product p
        JOIN p.category c
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY c.name
        ORDER BY COALESCE(SUM(p.price), 0) DESC
    """)
    List<Object[]> getRevenueByCategory(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT b.name, COALESCE(SUM(p.price), 0)
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productItem pi
        JOIN pi.product p
        JOIN p.brand b
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY b.name
        ORDER BY COALESCE(SUM(p.price), 0) DESC
    """)
    List<Object[]> getRevenueByBrand(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT p.productId, p.name, c.name, COUNT(oi), COALESCE(SUM(p.price), 0),
               COALESCE((SELECT AVG(CAST(r.rating AS DOUBLE))
                         FROM Review r
                         WHERE r.productId = p.productId
                           AND r.createdAt BETWEEN :startDate AND :endDate), 0.0)
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productItem pi
        JOIN pi.product p
        JOIN p.category c
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
        GROUP BY p.productId, p.name, c.name
        ORDER BY COUNT(oi) DESC
    """)
    List<Object[]> getTopSellingProductsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COUNT(DISTINCT p.productId)
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productItem pi
        JOIN pi.product p
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
    """)
    long countSoldProductsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COUNT(DISTINCT b.brandId)
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productItem pi
        JOIN pi.product p
        JOIN p.brand b
        WHERE o.orderDate BETWEEN :startDate AND :endDate
          AND o.orderStatus = 'COMPLETED'
    """)
    long countSoldBrandsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
