package com.shopkart.order;

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
class OrderControllerTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @BeforeEach void clearOrders() { jdbc.update("DELETE FROM orders"); }
  @Test void createsAndListsOrder() throws Exception {
    mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
      .content("{\"customerId\":\"customer-1\",\"productIds\":[1,2]}"))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING"));
    mvc.perform(get("/api/orders")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
  }
  @Test void rejectsEmptyProductIds() throws Exception {
    mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
      .content("{\"customerId\":\"customer-1\",\"productIds\":[]}"))
      .andExpect(status().isBadRequest());
  }
}