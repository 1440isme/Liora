package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.liora.dto.response.CartResponse;
import vn.liora.entity.Cart;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartMapper;
import vn.liora.repository.CartRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartServiceImpl implements ICartService {

    CartRepository cartRepository;
    UserRepository userRepository;
    CartMapper cartMapper;


    @Override
    public CartResponse getCartById(Long idCart) {
        // Lấy giỏ hàng từ database
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Lấy user hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra quyền
        if (!cart.getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Trả về DTO
        return cartMapper.toCartResponse(cart);
    }

    @Override
    public CartResponse clearCart(Long idCart) {
        // Lấy giỏ hàng từ database
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Lấy user hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra quyền
        if (!cart.getUser().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (cart.getCartProducts() != null) {
            cart.getCartProducts().clear();
        }

        // Lưu giỏ hàng đã xóa
        cart = cartRepository.save(cart);

        // Trả về DTO
        return cartMapper.toCartResponse(cart);
    }
}