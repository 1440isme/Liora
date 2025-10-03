package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long userId;
    String username;
    String email;
    String phone;
    String firstname;
    String lastname;
    LocalDate dob;
    Boolean gender;
    String avatar;
    Boolean active;
    LocalDate createdDate;
    Set<String> roles;
}

