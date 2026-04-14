package vn.liora.service.stock;

public interface ProductStockSubject {
    void attach(ProductStockObserver observer);

    void detach(ProductStockObserver observer);

    void notifyObservers(ProductStockChangedEvent event);
}
