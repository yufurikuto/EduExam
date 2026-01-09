package com.example.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class SubjectId {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;          // 試験タイトル
    // ★修正点: subjectsテーブルのIDを参照するように変更
    private Long subjectId;        
    
    private String unit;           // 単元
    private String grade;          // 学年
    private int timeLimitMinutes;  // 制限時間（分）
    private int passingScore;      // 合格点
    private String targetGroup;    // 対象グループ 
    
    // コンストラクタ、Getter/Setter, etc. は Lombok の @Data で自動生成
}