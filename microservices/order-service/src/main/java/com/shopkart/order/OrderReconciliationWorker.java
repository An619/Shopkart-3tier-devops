package com.shopkart.order;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Retries inventory confirmation for persisted orders after a partial checkout failure
 * or an Order Service restart. The reservation IDs are written before the first confirm
 * call, so retries are safe because Inventory Service confirmation is idempotent.
 *
 * This is a recovery loop, not a complete outbox implementation: failures are logged and
 * retried; operational alerting and a dead-letter/manual-resolution workflow are still needed.
 */
@Component
public class OrderReconciliationWorker {
  private static final Logger log = LoggerFactory.getLogger(OrderReconciliationWorker.class);
  private final JdbcTemplate jdbc;
  private final InventoryClient inventory;

  public OrderReconciliationWorker(JdbcTemplate jdbc, InventoryClient inventory) {
    this.jdbc = jdbc;
    this.inventory = inventory;
  }

  @Scheduled(fixedDelayString = "${shopkart.order.reconciliation-delay-ms:15000}",
      initialDelayString = "${shopkart.order.reconciliation-initial-delay-ms:10000}")
  public void reconcilePendingOrders() {
    List<PendingOrder> pending = jdbc.query(
      "SELECT id,reservation_ids FROM orders WHERE status='RECONCILIATION_REQUIRED' AND reservation_ids <> '' ORDER BY id LIMIT 50",
      (rs, row) -> new PendingOrder(rs.getLong("id"), rs.getString("reservation_ids")));
    for (PendingOrder order : pending) {
      try {
        for (String reservationId : order.reservationIds().split(",")) {
          if (!reservationId.isBlank()) inventory.confirm(reservationId);
        }
        int changed = jdbc.update(
          "UPDATE orders SET status='CONFIRMED' WHERE id=? AND status='RECONCILIATION_REQUIRED'",
          order.id());
        if (changed == 1) log.info("Reconciled checkout order {}", order.id());
      } catch (RuntimeException failure) {
        log.warn("Checkout order {} remains RECONCILIATION_REQUIRED; next retry will retry inventory confirmation",
          order.id(), failure);
      }
    }
  }

  private record PendingOrder(long id, String reservationIds) {}
}
