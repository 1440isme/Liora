package vn.liora.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import javax.naming.Name;
import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUser")
     Long userId;
    @Column(name = "UserName", nullable = false, unique = true)
     String username;
    @Column(name = "Password", nullable = false)
     String password;
    @Column(name = "Email", nullable = false)
     String email;
    @Column(name = "Phone")
     String phone;
    @Column(name = "Firstname",nullable = false)
     String firstname ;
    @Column(name = "Lastname",nullable = false)
     String lastname ;
    @Column(name = "DoB")
     LocalDate dob;
    @Column(name = "Gender")
     Boolean gender;
    @Column(name = "Avatar")
     String avatar;
    @Column(name = "Active")
     Boolean active;
    @Column(name = "CreatedDate")
     LocalDate createdDate;

    @ManyToMany
    @JoinTable(name = "User_Role")
    Set<Role> roles;
}
