package com.example.backend.service;

import com.example.backend.model.News;
import com.example.backend.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class NewsService {

    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    public List<News> getAllNews() {
        return newsRepository.findAllByOrderByDateDesc();
    }
    
    public Optional<News> getNewsById(Long id) {
        return newsRepository.findById(id);
    }
    
    public List<News> getNewsByCategory(String category) {
        return newsRepository.findByCategory(category);
    }
    
    public List<News> searchNews(String term) {
        return newsRepository.findByTitleContainingIgnoreCaseOrSummaryContainingIgnoreCase(term, term);
    }
    
    public News createNews(News news, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            try {
                String filePath = fileStorageService.storeFile(image, "news-images");
                news.setImageUrl("/uploads/" + filePath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload news image", e);
            }
        }
        
        return newsRepository.save(news);
    }
    
    public News updateNews(Long id, News updatedNews, MultipartFile image) {
        News existingNews = newsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("News not found with id: " + id));
            
        existingNews.setTitle(updatedNews.getTitle());
        existingNews.setCategory(updatedNews.getCategory());
        existingNews.setSummary(updatedNews.getSummary());
        existingNews.setContent(updatedNews.getContent());
        
        if (image != null && !image.isEmpty()) {
            try {
                String filePath = fileStorageService.storeFile(image, "news-images");
                existingNews.setImageUrl("/uploads/" + filePath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload news image", e);
            }
        }
        
        return newsRepository.save(existingNews);
    }
    
    public void deleteNews(Long id) {
        newsRepository.deleteById(id);
    }
}
