package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Cart;
import vn.liora.entity.CartItem;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByIdCartItem(Long idCartItem);

    Optional<CartItem> findByCart_IdCartAndProduct_ProductId(Long idCart, Long productId);

    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product p JOIN FETCH p.images WHERE ci.cart = :cart AND ci.choose = true")
    List<CartItem> findByCartAndChooseTrueWithProduct(@Param("cart") Cart cart);

    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product p JOIN FETCH p.images WHERE ci.cart = :cart")
    List<CartItem> findByCartWithProduct(@Param("cart") Cart cart);

    @Query("SELECT SUM(ci.totalPrice) FROM CartItem ci WHERE ci.cart = :cart")
    BigDecimal getCartTotalAmount(@Param("cart") Cart cart);

    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cart = :cart")
    Long getCartItemCount(@Param("cart") Cart cart);

    List<CartItem> findByCartAndChooseTrue(Cart cart);

    List<CartItem> findByCart(Cart cart);

    @Query("""
            SELECT DISTINCT c.user
            FROM CartItem ci
            JOIN ci.cart c
            WHERE ci.product.productId = :productId
              AND c.user IS NOT NULL
              AND c.user.email IS NOT NULL
            """)
    List<User> findDistinctSubscribedUsersByProductId(@Param("productId") Long productId);
}
