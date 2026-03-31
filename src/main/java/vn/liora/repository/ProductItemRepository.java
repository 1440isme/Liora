package vn.liora.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.liora.entity.ProductItem;
import vn.liora.enums.ProductItemStatus;

import java.util.List;

@Repository
public interface ProductItemRepository extends JpaRepository<ProductItem, Long> {
    long countByProductProductIdAndStatus(Long productId, ProductItemStatus status);

    List<ProductItem> findByProductProductIdAndStatusOrderByProductItemIdAsc(
            Long productId,
            ProductItemStatus status,
            Pageable pageable);
}
