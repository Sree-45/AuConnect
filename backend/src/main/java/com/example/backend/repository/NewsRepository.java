package com.example.backend.repository;

import com.example.backend.model.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findByCategory(String category);
    
    List<News> findByTitleContainingIgnoreCaseOrSummaryContainingIgnoreCase(String title, String summary);
    
    List<News> findAllByOrderByDateDesc();
}
