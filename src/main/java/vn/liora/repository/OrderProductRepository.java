package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface OrderProductRepository extends JpaRepository<OrderProduct,Long> {
    List<OrderProduct> findByOrder(Order order);

    @Query("SELECT COUNT(op) FROM OrderProduct op WHERE op.order = :order")
    long countProductsByOrder(@Param("order") Order order);

    @Query("SELECT SUM(op.totalPrice) FROM OrderProduct op WHERE op.order = :order")
    BigDecimal getTotalPriceByOrder(@Param("order") Order order);

    // ======================== Doanh thu theo DANH MỤC ========================
    @Query("""
        SELECT c.name, SUM(op.totalPrice)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.category c
        WHERE o.orderDate BETWEEN :startDate AND :endDate
        GROUP BY c.name
        ORDER BY SUM(op.totalPrice) DESC
    """)
    List<Object[]> getRevenueByCategory(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ========================  Doanh thu theo THƯƠNG HIỆU ========================
    @Query("""
        SELECT b.name, SUM(op.totalPrice)
        FROM OrderProduct op
        JOIN op.order o
        JOIN op.product p
        JOIN p.brand b
        WHERE o.orderDate BETWEEN :startDate AND :endDate
        GROUP BY b.name
        ORDER BY SUM(op.totalPrice) DESC
    """)
    List<Object[]> getRevenueByBrand(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
