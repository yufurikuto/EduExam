package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.demo.entity.Question;
import com.example.demo.repository.QuestionRepository;

@Controller
@RequestMapping("/question")
public class QuestionManagementController {

    @Autowired
    private QuestionRepository questionRepository;

    /**
     * 問題プールの一覧表示画面を表示する
     * URL: /question/manage
     */
    @GetMapping("/manage")
    public String showQuestionPool(Model model) {
        
        // 1. 全問題の取得
        List<Question> allQuestions = questionRepository.findAll();
        
        // 2. 画面に渡すデータの準備
        model.addAttribute("allQuestions", allQuestions);

        // ※ここでは簡易的に、試験に紐づいていない問題も全て表示します。
        // 今後の課題として、検索・フィルタリング機能を追加できます。
        
        return "question_manage"; // question_manage.html を表示
    }
}