package com.shopkart.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @MockBean InventoryClient inventory;

  @BeforeEach void clearOrders() {
    jdbc.update("DELETE FROM orders");
    when(inventory.reserve(anyString(), anyLong(), anyInt())).thenAnswer(call ->
      new InventoryClient.Reservation(call.getArgument(0), call.getArgument(1), call.getArgument(2), "RESERVED"));
    when(inventory.confirm(anyString())).thenAnswer(call ->
      new InventoryClient.Reservation(call.getArgument(0), 1L, 1, "CONFIRMED"));
    when(inventory.release(anyString())).thenAnswer(call ->
      new InventoryClient.Reservation(call.getArgument(0), 1L, 1, "RELEASED"));
  }

  @Test void createsAndListsOrder() throws Exception {
    mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
      .content("{\"customerId\":\"customer-1\",\"productIds\":[1,2]}"))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("CONFIRMED"));
    verify(inventory, times(2)).reserve(anyString(), anyLong(), anyInt());
    verify(inventory, times(2)).confirm(anyString());
    mvc.perform(get("/api/orders")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
  }

  @Test void rejectsEmptyProductIds() throws Exception {
    mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
      .content("{\"customerId\":\"customer-1\",\"productIds\":[]}"))
      .andExpect(status().isBadRequest());
    verifyNoInteractions(inventory);
  }

  @Test void releasesEarlierReservationsWhenLaterReservationFails() throws Exception {
    when(inventory.reserve(anyString(), eq(2L), anyInt())).thenThrow(new RuntimeException("out of stock"));
    mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
      .content("{\"customerId\":\"customer-1\",\"productIds\":[1,2]}"))
      .andExpect(status().isConflict());
    verify(inventory).release(anyString());
    org.junit.jupiter.api.Assertions.assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM orders", Integer.class));
  }
}
