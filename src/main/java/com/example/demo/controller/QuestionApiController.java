package com.example.demo.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.QuestionService;

@RestController
@RequestMapping("/api/question")
public class QuestionApiController {

    @Autowired
    private QuestionService questionService;

    /**
     * 問題プールから問題を削除するAPI
     * URL: /api/question/delete/{questionId}
     */
    @PostMapping("/delete/{questionId}")
    public ResponseEntity<?> deleteQuestionFromPool(@PathVariable Long questionId) {
        try {
            questionService.deleteQuestion(questionId);
            
            return ResponseEntity.ok(Map.of("message", "問題ID " + questionId + " がプールから正常に削除されました。"));
        } catch (Exception e) {
            // 問題が見つからない場合や、外部キー制約違反（answersテーブルが残っているなど）の場合
            return ResponseEntity.internalServerError().body(Map.of("error", "問題の削除に失敗しました: " + e.getMessage()));
        }
    }
}