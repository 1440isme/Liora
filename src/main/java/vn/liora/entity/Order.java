package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrder")
    Long idOrder;
    @Column(name = "OrderDate", nullable = false)
    LocalDateTime orderDate;
    @Column(name = "TotalDiscount", nullable = false)
    BigDecimal totalDiscount;
    @Column(name = "Total", nullable = false)
    BigDecimal total;

    @Column(name = "PaymentMethod", nullable = false)
    String paymentMethod;


    @Column(name = "OrderStatus", nullable = false)
    String orderStatus;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    String name;
    @Column(name = "Phone", nullable = false)
    String phone;
    @Column(name = "AddressDetail", nullable = false, columnDefinition = "NVARCHAR(255)")
    String addressDetail;
    @Column(name = "Email")
    String email;
    @Column(name = "Note", columnDefinition = "NVARCHAR(255)")
    String note;


    @ManyToOne
    @JoinColumn(name = "IdAddress", nullable = true)
    @JsonIgnore
    private Address address;

    @ManyToOne
    @JoinColumn(name = "IdUser", nullable = true)
    @JsonIgnore
    private User user;

    @Column(name = "IdDiscount")
    private Long discountId;

    @ManyToOne
    @JoinColumn(name = "IdDiscount", insertable = false, updatable = false)
    @JsonIgnore
    private Discount discount;

}

