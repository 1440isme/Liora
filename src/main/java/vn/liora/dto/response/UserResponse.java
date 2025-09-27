package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long userId;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String firstname;
    private String lastname;
    private LocalDate dob;
    private Boolean gender;
    private String avatar;
    private Boolean active;
    private LocalDate createdDate;
}

