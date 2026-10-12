package com.shopkart.inventory;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
  public record Stock(long productId, int quantity) {}
  public record StockUpdate(@PositiveOrZero int quantity) {}
  public record ReservationRequest(
      @NotBlank @Size(max = 100) String reservationId,
      @Positive long productId,
      @Positive int quantity) {}
  public record Reservation(String reservationId, long productId, int quantity, String status) {}

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

  @PostMapping("/reservations")
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public Reservation reserve(@Valid @RequestBody ReservationRequest request) {
    List<Reservation> existing = jdbc.query(
      "SELECT reservation_id,product_id,quantity,status FROM inventory_reservations WHERE reservation_id=?",
      (rs, row) -> new Reservation(rs.getString("reservation_id"), rs.getLong("product_id"),
        rs.getInt("quantity"), rs.getString("status")), request.reservationId());

    if (!existing.isEmpty()) {
      Reservation prior = existing.get(0);
      if (prior.productId() != request.productId() || prior.quantity() != request.quantity()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation ID was already used with a different request");
      }
      if ("RELEASED".equals(prior.status())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation was already released");
      }
      // Idempotent retry: do not decrement stock a second time.
      return prior;
    }

    int changed = jdbc.update(
      "UPDATE inventory SET quantity=quantity-? WHERE product_id=? AND quantity>=?",
      request.quantity(), request.productId(), request.quantity());
    if (changed == 0) {
      List<Long> product = jdbc.query("SELECT product_id FROM inventory WHERE product_id=?",
        (rs, row) -> rs.getLong(1), request.productId());
      if (product.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product stock not found");
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock");
    }

    jdbc.update(
      "INSERT INTO inventory_reservations(reservation_id,product_id,quantity,status) VALUES (?,?,?,'RESERVED')",
      request.reservationId(), request.productId(), request.quantity());
    return new Reservation(request.reservationId(), request.productId(), request.quantity(), "RESERVED");
  }

  @PostMapping("/reservations/{reservationId}/confirm")
  @Transactional
  public Reservation confirm(@PathVariable String reservationId) {
    Reservation reservation = lockReservation(reservationId);
    if ("RELEASED".equals(reservation.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Released reservation cannot be confirmed");
    }
    if ("RESERVED".equals(reservation.status())) {
      jdbc.update("UPDATE inventory_reservations SET status='CONFIRMED' WHERE reservation_id=?", reservationId);
      return new Reservation(reservation.reservationId(), reservation.productId(), reservation.quantity(), "CONFIRMED");
    }
    return reservation;
  }

  @PostMapping("/reservations/{reservationId}/release")
  @Transactional
  public Reservation release(@PathVariable String reservationId) {
    Reservation reservation = lockReservation(reservationId);
    if ("CONFIRMED".equals(reservation.status())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Confirmed reservation requires a compensating inventory operation");
    }
    if ("RESERVED".equals(reservation.status())) {
      jdbc.update("UPDATE inventory SET quantity=quantity+? WHERE product_id=?",
        reservation.quantity(), reservation.productId());
      jdbc.update("UPDATE inventory_reservations SET status='RELEASED' WHERE reservation_id=?", reservationId);
      return new Reservation(reservation.reservationId(), reservation.productId(), reservation.quantity(), "RELEASED");
    }
    return reservation;
  }

  private Reservation lockReservation(String reservationId) {
    List<Reservation> found = jdbc.query(
      "SELECT reservation_id,product_id,quantity,status FROM inventory_reservations WHERE reservation_id=? FOR UPDATE",
      (rs, row) -> new Reservation(rs.getString("reservation_id"), rs.getLong("product_id"),
        rs.getInt("quantity"), rs.getString("status")), reservationId);
    if (found.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
    return found.get(0);
  }

  @GetMapping("/health") public Map<String,String> health() {
    return Map.of("service","inventory-service","status","UP");
  }
}
