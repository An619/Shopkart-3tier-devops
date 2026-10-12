package com.shopkart.inventory;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
  private final Map<Long,Integer> stock = new ConcurrentHashMap<>(Map.of(1L,25,2L,40,3L,60));
  @GetMapping("/{productId}") public Stock get(@PathVariable long productId) { Integer qty=stock.get(productId); if(qty==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Product stock not found"); return new Stock(productId,qty); }
  @PutMapping("/{productId}") public Stock update(@PathVariable long productId,@Valid @RequestBody StockUpdate request) { stock.put(productId,request.quantity()); return new Stock(productId,request.quantity()); }
  @GetMapping("/health") public Map<String,String> health() { return Map.of("service","inventory-service","status","UP"); }
}