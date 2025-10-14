package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.CartResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartMapper;
import vn.liora.repository.CartRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartServiceImpl implements ICartService {

    CartRepository cartRepository;
    UserRepository userRepository;
    CartMapper cartMapper;

    @Override
    public CartResponse getCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    // Tự động tạo cart mới nếu chưa có
                    log.info("Creating new cart for user: {}", user.getUsername());
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
        
        return cartMapper.toCartResponse(cart);
    }
}

