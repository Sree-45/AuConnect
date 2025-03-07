package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.model.Post;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUsernameInOrderByCreatedDateDesc(List<String> connections);

    List<Post> findByUsernameOrderByCreatedDateDesc(String username);
}