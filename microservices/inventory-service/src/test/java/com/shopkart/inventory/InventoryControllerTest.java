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
  @BeforeEach void resetStock() { jdbc.update("INSERT INTO inventory(product_id,quantity) VALUES (1,25) ON CONFLICT (product_id) DO UPDATE SET quantity=25"); }
  @Test void readsSeedStock() throws Exception {
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(25));
  }
  @Test void updatesStock() throws Exception {
    mvc.perform(put("/api/inventory/1").contentType(MediaType.APPLICATION_JSON)
      .content("{\"quantity\":12}"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(12));
  }
}