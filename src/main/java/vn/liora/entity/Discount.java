package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "Discounts")
public class Discount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdDiscount")
    private Long discountId;

    @Column(name = "Name", columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "DiscountPercent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "StartDate", columnDefinition = "DATETIME")
    private LocalDateTime startDate;

    @Column(name = "EndDate", columnDefinition = "DATETIME")
    private LocalDateTime endDate;

    @Column(name = "IsActive")
    private Boolean isActive;

    @Column(name = "CreatedDate", columnDefinition = "DATETIME")
    private LocalDateTime createdDate;
}
