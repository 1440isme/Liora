package vn.liora.service.stock;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import vn.liora.entity.Product;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductStockEventPublisher implements ProductStockSubject {

    private final StockThresholdPolicy stockThresholdPolicy;
    private final List<ProductStockObserver> observers = new ArrayList<>();

    public ProductStockEventPublisher(StockThresholdPolicy stockThresholdPolicy,
            List<ProductStockObserver> initialObservers) {
        this.stockThresholdPolicy = stockThresholdPolicy;
        if (initialObservers != null) {
            this.observers.addAll(initialObservers);
        }
    }

    @Override
    public void attach(ProductStockObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    @Override
    public void detach(ProductStockObserver observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(ProductStockChangedEvent event) {
        for (ProductStockObserver observer : List.copyOf(observers)) {
            observer.update(event);
        }
    }

    public void publishIfNeeded(Product product, Integer oldStock, Integer newStock) {
        if (product == null || product.getProductId() == null) {
            return;
        }

        StockEventType eventType = stockThresholdPolicy.determineEvent(oldStock, newStock);
        if (eventType == null) {
            return;
        }

        ProductStockChangedEvent event = new ProductStockChangedEvent(
                product.getProductId(),
                product.getName(),
                oldStock,
                newStock,
                eventType,
                LocalDateTime.now());

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    notifyObservers(event);
                }
            });
            return;
        }

        notifyObservers(event);
    }
}
