package com.example.backend.repository;

import com.example.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE " +
           "(m.fromUsername = ?1 AND m.toUsername = ?2) OR " +
           "(m.fromUsername = ?2 AND m.toUsername = ?1) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findConversationMessages(String username1, String username2);
    
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.fromUsername = ?1 THEN m.toUsername ELSE m.fromUsername END " +
           "FROM Message m " +
           "WHERE m.fromUsername = ?1 OR m.toUsername = ?1")
    List<String> findConversationUsernames(String username);
    
    @Query("SELECT m FROM Message m WHERE " +
           "((m.fromUsername = ?1 AND m.toUsername = ?2) OR " +
           "(m.fromUsername = ?2 AND m.toUsername = ?1)) " +
           "ORDER BY m.timestamp DESC")
    List<Message> findLatestMessagesBetween(String username1, String username2);
    
    List<Message> findByToUsernameAndIsReadFalse(String toUsername);
    
    @Query("SELECT m FROM Message m WHERE " +
           "m.toUsername = ?1 AND m.isRead = false " +
           "ORDER BY m.timestamp DESC")
    List<Message> findRecentMessages(String username);
    
    @Modifying
    @Transactional
    void deleteByFromUsernameOrToUsername(String fromUsername, String toUsername);
}