package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "ProductDiscounts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"ProductId", "DiscountId"}))
public class ProductDiscount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Long id;

    @Column(name = "ProductId")
    private Long productId;

    @Column(name = "DiscountId")
    private Long discountId;
}
