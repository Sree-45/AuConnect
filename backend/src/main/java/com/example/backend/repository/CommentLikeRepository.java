package com.example.backend.repository;

import com.example.backend.model.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    CommentLike findByCommentIdAndUsername(Long commentId, String username);
    
    int countByCommentId(Long commentId);
    
    @Query("SELECT cl.commentId FROM CommentLike cl WHERE cl.username = :username")
    List<Long> findCommentIdsByUsername(String username);
    
    @Transactional
    void deleteByCommentId(Long commentId);
}
