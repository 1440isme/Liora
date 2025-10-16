package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Address")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdAddress")
    Long idAddress;
    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    String name;
    @Column(name = "Phone", nullable = false)
    String phone;
    @Column(name = "AddressDetail", nullable = false, columnDefinition = "NVARCHAR(255)")
    String addressDetail;
    @Column(name = "Ward", nullable = false, columnDefinition = "NVARCHAR(255)")
    String ward;
    @Column(name = "Province", nullable = false, columnDefinition = "NVARCHAR(255)")
    String province;
    @Column(name = "IsDefault")
    @Builder.Default
    Boolean isDefault = false;

    @ManyToOne
    @JoinColumn(name = "IdUser")
    @JsonIgnore
    private User user;

}
