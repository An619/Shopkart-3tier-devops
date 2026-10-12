package com.shopkart.order;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;

@Component
public class InventoryClient {
  public record ReservationRequest(String reservationId, long productId, int quantity) {}
  public record Reservation(String reservationId, long productId, int quantity, String status) {}
  private final RestClient client;

  public InventoryClient(RestClient.Builder builder,
      @Value("${shopkart.inventory.base-url:http://localhost:8083}") String baseUrl) {
    this.client = builder.baseUrl(baseUrl).build();
  }

  public Reservation reserve(String id, long productId, int quantity) {
    try {
      return client.post().uri("/api/inventory/reservations")
        .body(new ReservationRequest(id, productId, quantity))
        .retrieve().body(Reservation.class);
    } catch (RestClientResponseException ex) {
      HttpStatus status = ex.getStatusCode().value() == 404 ? HttpStatus.NOT_FOUND
        : ex.getStatusCode().value() == 409 ? HttpStatus.CONFLICT
        : HttpStatus.SERVICE_UNAVAILABLE;
      throw new ResponseStatusException(status,
        "Inventory reservation failed with HTTP " + ex.getStatusCode().value(), ex);
    }
  }

  public Reservation confirm(String id) {
    return client.post().uri("/api/inventory/reservations/{id}/confirm", id)
      .retrieve().body(Reservation.class);
  }

  public Reservation release(String id) {
    return client.post().uri("/api/inventory/reservations/{id}/release", id)
      .retrieve().body(Reservation.class);
  }
}
