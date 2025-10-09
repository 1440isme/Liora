package vn.liora.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Address;
import vn.liora.entity.Cart;
import vn.liora.entity.CartProduct;
import vn.liora.entity.Product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartProductRepository extends JpaRepository<CartProduct,Long> {
    Optional<CartProduct> findByIdCartProduct(Long idCartProduct);
    Optional<CartProduct> findByCart_IdCartAndProduct_ProductId(Long idCart, Long productId);
    List<CartProduct> findByCartAndChooseTrue(Cart cart);




}
