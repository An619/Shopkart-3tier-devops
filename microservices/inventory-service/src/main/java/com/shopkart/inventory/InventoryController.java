package com.shopkart.inventory;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
  public record Stock(long productId, int quantity) {}
  public record StockUpdate(@PositiveOrZero int quantity) {}
  private final JdbcTemplate jdbc;
  public InventoryController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  @GetMapping("/{productId}") public Stock get(@PathVariable long productId) {
    List<Stock> found = jdbc.query("SELECT product_id,quantity FROM inventory WHERE product_id=?",
      (rs, row) -> new Stock(rs.getLong("product_id"), rs.getInt("quantity")), productId);
    if (found.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product stock not found");
    return found.get(0);
  }
  @PutMapping("/{productId}") public Stock update(@PathVariable long productId, @Valid @RequestBody StockUpdate request) {
    int changed = jdbc.update("UPDATE inventory SET quantity=? WHERE product_id=?", request.quantity(), productId);
    if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product stock not found");
    return get(productId);
  }
  @GetMapping("/health") public Map<String,String> health() { return Map.of("service","inventory-service","status","UP"); }
}
