package com.shopkart.inventory;

import org.junit.jupiter.api.Test;
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
  @Test void readsSeedStock() throws Exception {
    mvc.perform(get("/api/inventory/1")).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(25));
  }
  @Test void updatesStock() throws Exception {
    mvc.perform(put("/api/inventory/1").contentType(MediaType.APPLICATION_JSON)
      .content("{\"quantity\":12}"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(12));
  }
}