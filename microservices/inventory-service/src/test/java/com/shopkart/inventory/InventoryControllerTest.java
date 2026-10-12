package com.shopkart.inventory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class InventoryControllerTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @BeforeEach void resetStock() { jdbc.update("DELETE FROM inventory_reservations"); jdbc.update("INSERT INTO inventory(product_id,quantity) VALUES (1,25) ON CONFLICT (product_id) DO UPDATE SET quantity=25"); }
  @Test void readsSeedStock() throws Exception {
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(25));
  }
  @Test void updatesStock() throws Exception {
    mvc.perform(put("/api/inventory/1").contentType(MediaType.APPLICATION_JSON)
      .content("{\"quantity\":12}"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(12));
  }

  @Test void reservationIsIdempotentAndDoesNotDoubleDecrement() throws Exception {
    String request = "{\"reservationId\":\"test-reserve-1\",\"productId\":1,\"quantity\":4}";
    mvc.perform(post("/api/inventory/reservations").contentType(MediaType.APPLICATION_JSON).content(request))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("RESERVED"));
    mvc.perform(post("/api/inventory/reservations").contentType(MediaType.APPLICATION_JSON).content(request))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("RESERVED"));
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(21));
  }

  @Test void releaseRestoresStockOnlyOnce() throws Exception {
    mvc.perform(post("/api/inventory/reservations").contentType(MediaType.APPLICATION_JSON)
      .content("{\"reservationId\":\"test-release-1\",\"productId\":1,\"quantity\":5}"))
      .andExpect(status().isCreated());
    mvc.perform(post("/api/inventory/reservations/test-release-1/release"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RELEASED"));
    mvc.perform(post("/api/inventory/reservations/test-release-1/release"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RELEASED"));
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(25));
  }

  @Test void rejectsReservationWhenStockIsInsufficient() throws Exception {
    mvc.perform(post("/api/inventory/reservations").contentType(MediaType.APPLICATION_JSON)
      .content("{\"reservationId\":\"test-reserve-low-stock\",\"productId\":1,\"quantity\":999}"))
      .andExpect(status().isConflict());
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(25));
  }

  @Test void confirmedReservationCannotBeReleasedWithoutCompensation() throws Exception {
    mvc.perform(post("/api/inventory/reservations").contentType(MediaType.APPLICATION_JSON)
      .content("{\"reservationId\":\"test-confirm-1\",\"productId\":1,\"quantity\":3}"))
      .andExpect(status().isCreated());
    mvc.perform(post("/api/inventory/reservations/test-confirm-1/confirm"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"));
    mvc.perform(post("/api/inventory/reservations/test-confirm-1/release"))
      .andExpect(status().isConflict());
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(22));
  }

}