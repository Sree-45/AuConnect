package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    public void sendVerificationEmail(String to, String otp) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setTo(to);
        helper.setSubject("AuConnect Email Verification");
        
        String emailContent = 
                "<html><body>" +
                "<h2>Welcome to AuConnect.</h2>" +
                "<p>Thank you for registering. Please verify your email address using the OTP below:</p>" +
                "<h3 style='background-color: #f0f0f0; padding: 10px; font-size: 24px; letter-spacing: 2px;'>" + otp + "</h3>" +
                "<p>This OTP will expire in 10 minutes.</p>" +
                "<p>If you didn't register for AuConnect, please ignore this email.</p>" +
                "</body></html>";
        
        helper.setText(emailContent, true); // true indicates HTML content
        
        mailSender.send(message);
    }
}
