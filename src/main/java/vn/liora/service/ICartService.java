package vn.liora.service;

import vn.liora.dto.response.CartResponse;

import java.util.List;

public interface ICartService {
    CartResponse getCartById(Long idCart);
    CartResponse clearCart(Long idCart);
}
