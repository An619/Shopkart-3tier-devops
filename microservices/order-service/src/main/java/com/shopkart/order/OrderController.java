package com.shopkart.order;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
  public record Order(long id, String customerId, List<Long> productIds, String status, Instant createdAt) {}
  public record CreateOrderRequest(@NotBlank String customerId, @NotEmpty List<Long> productIds) {}
  private final JdbcTemplate jdbc;
  public OrderController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  private Order map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    String raw = rs.getString("product_ids");
    List<Long> ids = raw.isBlank() ? List.of() : Arrays.stream(raw.split(",")).map(Long::valueOf).toList();
    return new Order(rs.getLong("id"), rs.getString("customer_id"), ids, rs.getString("status"), rs.getTimestamp("created_at").toInstant());
  }
  @GetMapping public List<Order> list() { return jdbc.query("SELECT id,customer_id,product_ids,status,created_at FROM orders ORDER BY id", this::map); }
  @GetMapping("/{id}") public Order get(@PathVariable long id) {
    List<Order> found = jdbc.query("SELECT id,customer_id,product_ids,status,created_at FROM orders WHERE id=?", this::map, id);
    if (found.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
    return found.get(0);
  }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Order create(@Valid @RequestBody CreateOrderRequest request) {
    String ids = request.productIds().stream().map(String::valueOf).collect(Collectors.joining(","));
    Long id = jdbc.queryForObject("INSERT INTO orders(customer_id,product_ids,status) VALUES (?,?,?) RETURNING id",
      Long.class, request.customerId(), ids, "PENDING");
    return get(id);
  }
  @PatchMapping("/{id}/status") public Order updateStatus(@PathVariable long id, @RequestParam String status) {
    get(id);
    if (!List.of("PENDING","CONFIRMED","SHIPPED","CANCELLED").contains(status))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status");
    jdbc.update("UPDATE orders SET status=? WHERE id=?", status, id);
    return get(id);
  }
  @GetMapping("/health") public Map<String,String> health() { return Map.of("service","order-service","status","UP"); }
}
