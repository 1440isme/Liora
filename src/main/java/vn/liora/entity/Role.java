package vn.liora.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Roles")
public class Role {
    @Id
    String name;
    String description;

    @ManyToMany
    @JoinTable(name = "Role_Permission")
    Set<Permission> permissions;
}
