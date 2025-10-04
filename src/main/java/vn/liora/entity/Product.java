package vn.liora.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "Products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdProduct")
    private Long productId;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "Description", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(name = "Price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Transient
    private BigDecimal discountPrice;

    @Column(name = "IdBrand")
    private Long brandId;

    @Column(name = "IdCategory")
    private Long categoryId;

    @Column(name = "Stock")
    private Integer stock;

    @Column(name = "SoldCount")
    private Integer soldCount;

    @Column(name = "CreatedDate", columnDefinition = "DATETIME")
    private LocalDateTime createdDate;

    @Column(name = "Available")
    private Boolean available;

    @Column(name = "AverageRating", precision = 2, scale = 1)
    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5.0")
    private BigDecimal averageRating;

    @Transient
    private Integer ratingCount;
}
