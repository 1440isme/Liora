package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.liora.dto.request.CartItemCreationRequest;
import vn.liora.dto.request.CartItemUpdateRequest;
import vn.liora.dto.response.CartItemResponse;
import vn.liora.service.ICartItemService;

import java.util.List;

@RestController
@RequestMapping("/cart-items/{idCart}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartItemController {
    ICartItemService cartItemService;

    @PostMapping
    public ResponseEntity<CartItemResponse> addItemToCart(
            @PathVariable Long idCart,
            @Valid @RequestBody CartItemCreationRequest request) {
        CartItemResponse response = cartItemService.addItemToCart(idCart, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItem(
            @PathVariable Long idCart,
            @PathVariable Long cartItemId,
            @Valid @RequestBody CartItemUpdateRequest request) {
        CartItemResponse response = cartItemService.updateCartItem(idCart, cartItemId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> getCartItemById(@PathVariable Long cartItemId) {
        CartItemResponse response = cartItemService.getCartItemById(cartItemId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/selected-items")
    public ResponseEntity<List<CartItemResponse>> getSelectedItems(@PathVariable Long idCart) {
        List<CartItemResponse> responses = cartItemService.getSelectedItems(idCart);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/selected")
    public ResponseEntity<Void> removeSelectedItems(@PathVariable Long idCart) {
        cartItemService.removeItemsInCart(idCart, null);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unavailable/{cartItemId}")
    public ResponseEntity<Void> removeUnavailableCartItem(
            @PathVariable Long idCart,
            @PathVariable Long cartItemId) {
        cartItemService.removeItemsInCart(idCart, List.of(cartItemId));
        return ResponseEntity.ok().build();
    }
}
