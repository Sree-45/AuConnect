package com.example.backend.repository;

import com.example.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedDateAsc(Long postId);
    List<Comment> findByPostIdOrderByCreatedDateAsc(Long postId);
    List<Comment> findByParentIdOrderByCreatedDateAsc(Long parentId);
    
    @Transactional
    void deleteByPostId(Long postId);
}
