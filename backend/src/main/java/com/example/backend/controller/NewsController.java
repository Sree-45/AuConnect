package com.example.backend.controller;

import com.example.backend.model.News;
import com.example.backend.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:5173")
public class NewsController {

    @Autowired
    private NewsService newsService;
    
    @GetMapping
    public ResponseEntity<List<News>> getAllNews() {
        return ResponseEntity.ok(newsService.getAllNews());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<News> getNewsById(@PathVariable Long id) {
        return newsService.getNewsById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<News>> getNewsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(newsService.getNewsByCategory(category));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<News>> searchNews(@RequestParam String term) {
        return ResponseEntity.ok(newsService.searchNews(term));
    }
    
    @PostMapping
    public ResponseEntity<News> createNews(
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("summary") String summary,
            @RequestParam(name = "content", required = false) String content,
            @RequestParam(name = "image", required = false) MultipartFile image) {
        
        News news = new News();
        news.setTitle(title);
        news.setCategory(category);
        news.setSummary(summary);
        news.setContent(content);
        
        News savedNews = newsService.createNews(news, image);
        return ResponseEntity.ok(savedNews);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<News> updateNews(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("summary") String summary,
            @RequestParam(name = "content", required = false) String content,
            @RequestParam(name = "image", required = false) MultipartFile image) {
        
        News news = new News();
        news.setTitle(title);
        news.setCategory(category);
        news.setSummary(summary);
        news.setContent(content);
        
        News updatedNews = newsService.updateNews(id, news, image);
        return ResponseEntity.ok(updatedNews);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getNewsCategories() {
        // Return predefined news categories
        List<String> categoryNames = Arrays.asList(
            "University News", "Academic", "Events", "Research", "Student Life"
        );
        
        List<Map<String, String>> categories = categoryNames.stream()
            .map(name -> {
                Map<String, String> category = new HashMap<>();
                category.put("name", name);
                return category;
            })
            .toList();
            
        return ResponseEntity.ok(categories);
    }
}
