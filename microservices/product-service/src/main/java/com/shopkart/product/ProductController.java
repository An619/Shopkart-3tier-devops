package com.shopkart.product;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/products")
@Validated
public class ProductController {
  public record Product(long id, String name, String category, BigDecimal price, int stock) {}
  public record ProductRequest(@NotBlank String name, @NotBlank String category, @PositiveOrZero BigDecimal price, @PositiveOrZero int stock) {}
  private final JdbcTemplate jdbc;
  public ProductController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  private Product map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new Product(rs.getLong("id"), rs.getString("name"), rs.getString("category"), rs.getBigDecimal("price"), rs.getInt("stock"));
  }
  @GetMapping public List<Product> list() {
    return jdbc.query("SELECT id,name,category,price,stock FROM products ORDER BY id", this::map);
  }
  @GetMapping("/{id}") public Product get(@PathVariable long id) {
    List<Product> found = jdbc.query("SELECT id,name,category,price,stock FROM products WHERE id=?", this::map, id);
    if (found.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
    return found.get(0);
  }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Product create(@Valid @RequestBody ProductRequest request) {
    Long id = jdbc.queryForObject("INSERT INTO products(name,category,price,stock) VALUES (?,?,?,?) RETURNING id",
      Long.class, request.name(), request.category(), request.price(), request.stock());
    return get(id);
  }
  @GetMapping("/health") public java.util.Map<String,String> health() { return java.util.Map.of("service","product-service","status","UP"); }
}
