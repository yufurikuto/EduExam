package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.demo.entity.Exam;
import com.example.demo.entity.Subject;
import com.example.demo.repository.ExamRepository;
import com.example.demo.repository.SubjectRepository;

@Controller
@RequestMapping("/exam/create")
public class ExamController {

    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private SubjectRepository subjectRepository; 

    /**
     * ★新規追加: ダッシュボードの「＋新規作成」ボタン用
     * URL: /exam/create/new
     * 動作: 空のフォームで exam_settings.html を開く
     */
    @GetMapping("/new")
    public String showCreateForm(Model model) {
        // 科目リストを取得
        List<Subject> allSubjects = subjectRepository.findAll();

        // 新規作成用の空のExamオブジェクト
        model.addAttribute("exam", new Exam());
        
        // exam_settings.html が必要とするデータ
        model.addAttribute("subjects", allSubjects);
        model.addAttribute("grades", new String[]{"1年生", "2年生", "3年生","4年生"});
        model.addAttribute("isEditMode", false); // 新規作成モード
        
        return "exam_settings"; 
    }

    /**
     * 既存機能: 試験設定の編集画面を表示
     * URL: /exam/create/settings/{examId}
     */
    @GetMapping("/settings/{examId}")
    public String showEditSettingsForm(@PathVariable Long examId, Model model) {
        // 既存のExamデータをDBからロード
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("試験ID " + examId + " が見つかりません"));
            
        List<Subject> allSubjects = subjectRepository.findAll();
        
        model.addAttribute("exam", exam); 
        model.addAttribute("subjects", allSubjects);
        model.addAttribute("grades", new String[]{"1年生", "2年生", "3年生","4年生"});
        model.addAttribute("isEditMode", true); // 編集モード

        return "exam_settings"; 
    }

    /**
     * 共通: 設定の保存処理
     * exam_settings.html の <form> から呼ばれる
     */
    @PostMapping("/saveSettings")
    public String saveSettings(@ModelAttribute Exam exam) {
        // IDがあれば更新、なければ新規作成として保存
        Exam savedExam = examRepository.save(exam);
        
        // 保存後、問題作成画面へリダイレクト
        return "redirect:/exam/create/questions/" + savedExam.getId();
    }
}