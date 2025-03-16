package com.example.backend.controller;

import com.example.backend.model.EventCategory;
import com.example.backend.service.EventCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event-categories")
@CrossOrigin(origins = "http://localhost:5173")
public class EventCategoryController {

    @Autowired
    private EventCategoryService categoryService;
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<EventCategory> categories = categoryService.getAllCategories();
        
        // Convert to a simpler format for frontend
        List<Map<String, Object>> response = categories.stream()
            .map(cat -> {
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("id", cat.getId());
                categoryMap.put("name", cat.getName());
                return categoryMap;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            EventCategory category = new EventCategory();
            category.setName(name);
            
            EventCategory savedCategory = categoryService.createCategory(category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedCategory.getId());
            response.put("name", savedCategory.getName());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        }
    }
    
    @PutMapping("/{categoryName}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable String categoryName,
            @RequestBody Map<String, String> request) {
        try {
            String newName = request.get("name");
            if (newName == null || newName.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            EventCategory updatedCategory = categoryService.updateCategory(categoryName, newName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedCategory.getId());
            response.put("name", updatedCategory.getName());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @DeleteMapping("/{categoryName}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable String categoryName) {
        try {
            categoryService.deleteCategory(categoryName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("deleted", true);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, String>> initializeDefaultCategories() {
        try {
            categoryService.initializeDefaultCategories();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Default categories initialized successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
