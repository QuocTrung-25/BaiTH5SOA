package com.example.soa.service;

import com.example.soa.dto.ProductRequest;
import com.example.soa.model.Product;
import com.example.soa.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product findById(Integer id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với id: " + id));
    }

    public Product create(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        return productRepository.save(product);
    }

    public Product update(Integer id, ProductRequest request) {
        Product product = findById(id);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        return productRepository.save(product);
    }

    public void delete(Integer id) {
        Product product = findById(id);
        productRepository.delete(product);
    }

    public Product checkAndDecrementStock(Integer productId, int quantity) {
        Product product = findById(productId);
        if (product.getQuantity() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm '" + product.getName() + "' không đủ số lượng tồn kho (Còn lại: "
                            + product.getQuantity() + ", Yêu cầu: " + quantity + ")");
        }
        product.setQuantity(product.getQuantity() - quantity);
        return productRepository.save(product);
    }
}
