package com.shopkart.order;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
  public record Order(long id, String customerId, List<Long> productIds, String status, Instant createdAt) {}
  public record CreateOrderRequest(@NotBlank String customerId, @NotEmpty List<@Positive Long> productIds) {}
  private final JdbcTemplate jdbc;
  private final InventoryClient inventory;

  public OrderController(JdbcTemplate jdbc, InventoryClient inventory) {
    this.jdbc = jdbc;
    this.inventory = inventory;
  }

  private Order map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    String raw = rs.getString("product_ids");
    List<Long> ids = raw.isBlank() ? List.of() : Arrays.stream(raw.split(",")).map(Long::valueOf).toList();
    return new Order(rs.getLong("id"), rs.getString("customer_id"), ids, rs.getString("status"), rs.getTimestamp("created_at").toInstant());
  }

  @GetMapping public List<Order> list() {
    return jdbc.query("SELECT id,customer_id,product_ids,status,created_at FROM orders ORDER BY id", this::map);
  }

  @GetMapping("/{id}") public Order get(@PathVariable("id") long id) {
    List<Order> found = jdbc.query("SELECT id,customer_id,product_ids,status,created_at FROM orders WHERE id=?", this::map, id);
    if (found.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
    return found.get(0);
  }

  @PostMapping @ResponseStatus(HttpStatus.CREATED)
  public Order create(@Valid @RequestBody CreateOrderRequest request,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
    if (idempotencyKey != null && (idempotencyKey.isBlank() || idempotencyKey.length() > 100)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key must contain 1-100 characters");
    }
    if (idempotencyKey != null) {
      List<Order> prior = jdbc.query(
        "SELECT id,customer_id,product_ids,status,created_at FROM orders WHERE idempotency_key=?",
        this::map, idempotencyKey);
      if (!prior.isEmpty()) return prior.get(0);
    }
    Map<Long, Integer> quantities = request.productIds().stream()
      .collect(Collectors.toMap(id -> id, id -> 1, Integer::sum, LinkedHashMap::new));
    List<String> acquired = new ArrayList<>();
    Map<Long, String> reservations = new LinkedHashMap<>();

    try {
      for (Map.Entry<Long, Integer> item : quantities.entrySet()) {
        String reservationId = UUID.randomUUID().toString();
        inventory.reserve(reservationId, item.getKey(), item.getValue());
        acquired.add(reservationId);
        reservations.put(item.getKey(), reservationId);
      }
    } catch (RuntimeException failure) {
      releaseAll(acquired);
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Inventory reservation failed; checkout was not created", failure);
    }

    String ids = request.productIds().stream().map(String::valueOf).collect(Collectors.joining(","));
    Long id;
    try {
      id = jdbc.queryForObject("INSERT INTO orders(customer_id,product_ids,status,idempotency_key) VALUES (?,?,?,?) RETURNING id",
        Long.class, request.customerId(), ids, "PENDING", idempotencyKey);
    } catch (DuplicateKeyException duplicate) {
      releaseAll(acquired);
      if (idempotencyKey != null) {
        List<Order> prior = jdbc.query(
          "SELECT id,customer_id,product_ids,status,created_at FROM orders WHERE idempotency_key=?",
          this::map, idempotencyKey);
        if (!prior.isEmpty()) return prior.get(0);
      }
      throw duplicate;
    } catch (RuntimeException failure) {
      releaseAll(acquired);
      throw failure;
    }

    try {
      for (String reservationId : reservations.values()) inventory.confirm(reservationId);
      jdbc.update("UPDATE orders SET status='CONFIRMED' WHERE id=?", id);
      return get(id);
    } catch (RuntimeException failure) {
      jdbc.update("UPDATE orders SET status='RECONCILIATION_REQUIRED' WHERE id=?", id);
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
        "Order created but inventory confirmation was incomplete; reconcile order " + id, failure);
    }
  }

  private void releaseAll(List<String> ids) {
    for (int i = ids.size() - 1; i >= 0; i--) {
      try { inventory.release(ids.get(i)); }
      catch (RuntimeException ignored) { /* reconciliation/metrics required for production */ }
    }
  }

  @PatchMapping("/{id}/status") public Order updateStatus(@PathVariable("id") long id, @RequestParam("status") String status) {
    get(id);
    if (!List.of("PENDING","CONFIRMED","SHIPPED","CANCELLED","RECONCILIATION_REQUIRED").contains(status))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status");
    jdbc.update("UPDATE orders SET status=? WHERE id=?", status, id);
    return get(id);
  }

  @GetMapping("/health") public Map<String,String> health() {
    return Map.of("service","order-service","status","UP");
  }
}
