package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "options") // ★修正点: テーブル名を明示的に "options" に設定
public class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ★修正点: データベースの外部キー名に合わせてカラム名を明示
    @Column(name = "question_id") 
    private Long questionId; 
    
    @Column(columnDefinition = "TEXT")
    private String optionText; // 選択肢のテキスト
    
    private boolean isCorrect; // 正解かどうか (is_correctに対応)

    // LombokによりGetter/Setterなどが自動生成
}