package com.example.backend.repository;

import java.util.List;
import com.example.backend.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    PostLike findByPostIdAndUsername(Long postId, String username);
    
    int countByPostId(Long postId);
    
    @Query("SELECT pl.postId FROM PostLike pl WHERE pl.username = :username")
    List<Long> findPostIdsByUsername(String username);

    void deleteByPostId(Long postId);
}