package vn.liora.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    void deleteAll();
    void delete(User user);
    void deleteById(Long id);
    long count();
    public User createUser(UserCreationRequest request);
    UserResponse findById(Long id);
    Optional<User> findByIdOptional(Long id);
    List<User> findAllById(Iterable<Long> ids);
    List<User> findAll(Sort sort);
    Page<User> findAll(Pageable pageable);
    List<User> findAll();
    <S extends User> S save(S entity);
    List<User> findByUsernameContaining(String username);
    Page<User> findByUsernameContaining(String username, Pageable pageable);
    Optional<User> findByUsername(String username);
}
