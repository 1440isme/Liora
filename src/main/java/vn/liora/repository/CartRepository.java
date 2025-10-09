package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Cart;
import vn.liora.entity.CartProduct;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart,Long> {
    Optional<Cart> findByUser(User user);







}
