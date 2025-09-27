package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUsers")
    private Long userId;
    @Column(name = "UserName", nullable = false, unique = true)
    private String username;
    @Column(name = "Password", nullable = false)
    private String password;
    @Column(name = "Email", nullable = false)
    private String email;
    @Column(name = "Phone")
    private String phone;
    @Column(name = "Firstname",nullable = false)
    private String firstname ;
    @Column(name = "Lastname",nullable = false)
    private String lastname ;
    @Column(name = "DoB")
    private LocalDate dob;
    @Column(name = "Gender")
    private Boolean gender;
    @Column(name = "Avatar")
    private String avatar;
    @Column(name = "Active")
    private Boolean active;
    @Column(name = "CreatedDate")
    private LocalDate createdDate;
    @Column(name = "IsAdmin")
    private Boolean isAdmin;
    @Column(name = "IsManager")
    private Boolean isManager;
}
