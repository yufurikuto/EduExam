package com.example.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id") 
    private Long examId; 
    
    @Column(columnDefinition = "TEXT")
    private String questionText;
    
    private String imageUrl; 
    
    private String questionType; 
    
    // ★新規追加: 順序管理用のフィールド
    private Integer sequenceNumber; 
    
    @Column(columnDefinition = "TEXT")
    private String correctAnswer;
    
    private int score;

    @Column(insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;
    
    // LombokによりGetter/Setterなどが自動生成
}