package vn.liora.service.stock;

import vn.liora.entity.User;

import java.util.List;

public interface ProductStockNotificationService {
    List<User> findSubscribedUsers(Long productId);

    void notifySubscribers(ProductStockChangedEvent event);
}
