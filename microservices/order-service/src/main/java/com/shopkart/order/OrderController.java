package com.shopkart.order;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
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
  private final List<Order> orders = new CopyOnWriteArrayList<>();
  @GetMapping public List<Order> list() { return List.copyOf(orders); }
  @GetMapping("/{id}") public Order get(@PathVariable long id) { return orders.stream().filter(o -> o.id()==id).findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found")); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Order create(@Valid @RequestBody CreateOrderRequest request) {
    long id = orders.stream().mapToLong(Order::id).max().orElse(1000)+1;
    Order order = new Order(id,request.customerId(),List.copyOf(request.productIds()),"PENDING",Instant.now()); orders.add(order); return order;
  }
  @PatchMapping("/{id}/status") public Order updateStatus(@PathVariable long id, @RequestParam String status) {
    Order old = get(id); if (!List.of("PENDING","CONFIRMED","SHIPPED","CANCELLED").contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported status");
    Order updated = new Order(old.id(),old.customerId(),old.productIds(),status,old.createdAt()); orders.remove(old); orders.add(updated); return updated;
  }
  @GetMapping("/health") public Map<String,String> health() { return Map.of("service","order-service","status","UP"); }
}