package com.example.backend.controller;

import com.example.backend.dto.MessageRequest;
import com.example.backend.model.Message;
import com.example.backend.model.Users;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody MessageRequest messageRequest) {
        try {
            Message message = new Message();
            message.setFromUsername(messageRequest.getFromUsername());
            message.setToUsername(messageRequest.getToUsername());
            message.setText(messageRequest.getText());
            message.setTimestamp(LocalDateTime.now());
            message.setRead(false);
            
            // Set attachment information if present
            if (messageRequest.getAttachmentUrl() != null && !messageRequest.getAttachmentUrl().isEmpty()) {
                message.setAttachmentUrl(messageRequest.getAttachmentUrl());
                message.setAttachmentType(messageRequest.getAttachmentType());
                message.setAttachmentName(messageRequest.getAttachmentName());
            }
            
            Message savedMessage = messageRepository.save(message);
            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/conversation/{otherUsername}")
    public ResponseEntity<List<Message>> getConversation(
            @PathVariable String otherUsername,
            @RequestParam String username) {
        
        List<Message> messages = messageRepository.findConversationMessages(username, otherUsername);
        
        // Mark messages as read if they were sent to the current user
        for (Message message : messages) {
            if (message.getToUsername().equals(username) && !message.isRead()) {
                message.setRead(true);
                messageRepository.save(message);
            }
        }
        
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(@RequestParam String username) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        // Get list of usernames the current user has conversations with
        List<String> conversationUsernames = messageRepository.findConversationUsernames(username);
        
        for (String otherUsername : conversationUsernames) {
            // Get user details
            Users user = userRepository.findByUsername(otherUsername);
            if (user == null) continue;
            
            // Get latest message
            List<Message> latestMessages = messageRepository.findLatestMessagesBetween(username, otherUsername);
            Message latestMessage = latestMessages.isEmpty() ? null : latestMessages.get(0);
            if (latestMessage == null) continue;
            
            Map<String, Object> conversation = new HashMap<>();
            conversation.put("id", otherUsername);
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", user.getUsername());
            userInfo.put("name", user.getFirstName() + " " + user.getLastName());
            userInfo.put("profilePhoto", user.getProfilePhoto());
            conversation.put("user", userInfo);
            
            Map<String, Object> messageInfo = new HashMap<>();
            messageInfo.put("text", latestMessage.getText());
            messageInfo.put("timestamp", latestMessage.getTimestamp().toString());
            // Make sure we're checking if the message is unread and was sent TO the current user
            boolean isUnread = latestMessage.getToUsername().equals(username) && !latestMessage.isRead();
            messageInfo.put("unread", isUnread);
            conversation.put("lastMessage", messageInfo);
            
            result.add(conversation);
        }
        
        // Sort conversations by latest message timestamp (newest first)
        result.sort((c1, c2) -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> m1 = (Map<String, Object>)c1.get("lastMessage");
            @SuppressWarnings("unchecked")
            Map<String, Object> m2 = (Map<String, Object>)c2.get("lastMessage");
            String t1 = (String)m1.get("timestamp");
            String t2 = (String)m2.get("timestamp");
            return t2.compareTo(t1);
        });
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentMessages(@RequestParam String username) {
        List<Message> unreadMessages = messageRepository.findRecentMessages(username);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Message message : unreadMessages) {
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", message.getId());
            messageData.put("sender", message.getFromUsername());
            
            // Get sender details
            Users sender = userRepository.findByUsername(message.getFromUsername());
            if (sender != null) {
                messageData.put("senderName", sender.getFirstName() + " " + sender.getLastName());
                messageData.put("senderPhoto", sender.getProfilePhoto());
            } else {
                messageData.put("senderName", message.getFromUsername());
                messageData.put("senderPhoto", null);
            }
            
            messageData.put("preview", message.getText());
            messageData.put("timestamp", message.getTimestamp());
            messageData.put("unread", !message.isRead());
            
            result.add(messageData);
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String username = request.get("username");
        Message message = messageRepository.findById(id).orElse(null);
        
        if (message != null && message.getToUsername().equals(username)) {
            message.setRead(true);
            messageRepository.save(message);
            return ResponseEntity.ok().build();
        }
        
        return ResponseEntity.badRequest().build();
    }
}