package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Order;
import vn.liora.entity.OrderProduct;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.util.List;
@Repository
public interface OrderProductRepository extends JpaRepository<OrderProduct,Long> {
    List<OrderProduct> findByOrder(Order order);

    @Query("SELECT COUNT(op) FROM OrderProduct op WHERE op.order = :order")
    long countProductsByOrder(@Param("order") Order order);

    @Query("SELECT SUM(op.totalPrice) FROM OrderProduct op WHERE op.order = :order")
    BigDecimal getTotalPriceByOrder(@Param("order") Order order);




}
