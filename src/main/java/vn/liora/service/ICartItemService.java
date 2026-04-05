package vn.liora.service;

import vn.liora.dto.request.CartItemCreationRequest;
import vn.liora.dto.request.CartItemUpdateRequest;
import vn.liora.dto.response.CartItemResponse;

import java.math.BigDecimal;
import java.util.List;

public interface ICartItemService {
    CartItemResponse addItemToCart(Long idCart, CartItemCreationRequest request);

    CartItemResponse updateCartItem(Long idCart, Long idCartItem, CartItemUpdateRequest request);

    void removeItemsInCart(Long idCart, List<Long> idCartItem);

    CartItemResponse getCartItemById(Long idCartItem);

    List<CartItemResponse> getSelectedItems(Long idCart);

    BigDecimal getSelectedItemsTotal(Long cartId);

    double getCartTotal(Long cartId);

    int getCartItemCount(Long cartId);

    List<CartItemResponse> getAllItemsInCart(Long cartId);
}
