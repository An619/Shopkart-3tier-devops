package com.shopkart.product;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
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
  private final List<Product> products = new java.util.concurrent.CopyOnWriteArrayList<>(List.of(
    new Product(1,"ShopKart Wireless Headphones","Electronics",new BigDecimal("1499.00"),25),
    new Product(2,"ShopKart Everyday Backpack","Fashion",new BigDecimal("899.00"),40),
    new Product(3,"ShopKart USB-C Charger","Accessories",new BigDecimal("599.00"),60)));
  @GetMapping public List<Product> list() { return List.copyOf(products); }
  @GetMapping("/{id}") public Product get(@PathVariable long id) { return products.stream().filter(p -> p.id()==id).findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Product not found")); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Product create(@Valid @RequestBody ProductRequest request) {
    long id = products.stream().mapToLong(Product::id).max().orElse(0)+1;
    Product product = new Product(id,request.name(),request.category(),request.price(),request.stock()); products.add(product); return product;
  }
  @GetMapping("/health") public java.util.Map<String,String> health() { return java.util.Map.of("service","product-service","status","UP"); }
}