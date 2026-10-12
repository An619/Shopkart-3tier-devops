package com.shopkart.product;

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
class ProductControllerTest {
  @Autowired MockMvc mvc;
  @Test void listsSeedProducts() throws Exception {
    mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
  }
  @Test void returnsHealth() throws Exception {
    mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
  }
  @Test void rejectsBlankProductName() throws Exception {
    mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
      .content("{\"name\":\"\",\"category\":\"Electronics\",\"price\":10,\"stock\":1}"))
      .andExpect(status().isBadRequest());
  }
}