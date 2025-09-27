package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.UserMapper;
import vn.liora.repository.UserRepository;
import vn.liora.service.IUserService;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class UserServiceImpl implements IUserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository) {this.userRepository = userRepository;}
    @Override
    public void deleteAll() {
        userRepository.deleteAll();
    }

    @Override
    public void delete(User user) {
        userRepository.delete(user);
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public long count() {
        return userRepository.count();
    }

    @Override
    public User createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = userMapper.toUser(request);
        return save(user);
    }

    public UserResponse updateUser(Long userId, UserUpdateRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));
        userMapper.updateUser(user, request);
        return userMapper.toUserResponse(save(user));
    }


    @Override
    public UserResponse findById(Long id) {
        return userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND)));
    }

    @Override
    public Optional<User> findByIdOptional(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public List<User> findAllById(Iterable<Long> ids) {
        return userRepository.findAllById(ids);
    }

    @Override
    public List<User> findAll(Sort sort) {
        return userRepository.findAll(sort);
    }

    @Override
    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public <S extends User> S save(S entity) {
        if (entity.getUserId() == null) {
            return userRepository.save(entity);
        }else {
            Optional<User> opt = findByIdOptional(entity.getUserId());
            if (opt.isPresent()) {
                if (StringUtils.hasText(entity.getAvatar()))
                    entity.setAvatar(opt.get().getAvatar());
            }   else entity.setAvatar(entity.getAvatar());
        return userRepository.save(entity);
        }
    }

    @Override
    public List<User> findByUsernameContaining(String username) {
        return userRepository.findByUsernameContaining(username);
    }

    @Override
    public Page<User> findByUsernameContaining(String username, Pageable pageable) {
        return userRepository.findByUsernameContaining(username, pageable);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
