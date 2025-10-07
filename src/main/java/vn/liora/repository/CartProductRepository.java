package vn.liora.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Cart;
import vn.liora.entity.CartProduct;
import vn.liora.entity.Product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartProductRepository extends JpaRepository<CartProduct,Long> {
    List<CartProduct> findByCart(Cart cart);
    long countByCart(Cart cart);

    void deleteByCart(Cart cart);
    void deleteByCartAndProduct(Cart cart, Product product);
    List<CartProduct> findByCartAndChooseTrue(Cart cart);


    @Modifying
    @Transactional
    @Query("UPDATE CartProduct cp SET cp.totalPrice = cp.quantity * cp.product.price WHERE cp.cart = :cart")
    void updateTotalPriceByCart(@Param("cart") Cart cart);


}
