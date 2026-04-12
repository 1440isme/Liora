package vn.liora.service.stock;

public interface ProductStockObserver {
    void update(ProductStockChangedEvent event);
}
