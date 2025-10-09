package vn.liora.service;

import vn.liora.dto.response.CartResponse;
import vn.liora.entity.Cart;
import vn.liora.entity.User;

import java.math.BigDecimal;
import java.util.List;

public interface ICartService {
    CartResponse getCart(Long userId);


}
