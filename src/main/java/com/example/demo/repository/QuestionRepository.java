package com.example.demo.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Question; 

public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    // 試験IDに基づいて問題リストを取得するメソッド
    List<Question> findByExamId(Long examId); 

    // ★修正: QuestionControllerで呼び出されているシグネチャを追加
    List<Question> findByExamId(Long examId, Sort sort);
}