package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.entity.Exam;
import com.example.demo.entity.ExamResult;
import com.example.demo.entity.Subject;
import com.example.demo.entity.User;
import com.example.demo.repository.ExamRepository;
import com.example.demo.repository.ExamResultRepository;
import com.example.demo.repository.SubjectRepository;
import com.example.demo.repository.UserRepository;

import jakarta.servlet.http.HttpSession; // ★追加

@Controller
public class TeacherController {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;

    /**
     * 教員用ダッシュボード
     */
    @GetMapping("/teacher_home")
    public String showTeacherDashboard(
            Model model,
            HttpSession session, // ★追加: セッションを使う
            @RequestParam(required = false) Long filterSubjectId,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        // =================================================================
        // ★修正: セッションからログイン中のユーザーを取得する
        // =================================================================
        User user = (User) session.getAttribute("currentUser");

        // もしセッション切れ（またはログインせずにアクセス）なら、ログイン画面へ飛ばす
        if (user == null) {
            return "redirect:/login";
        }
        
        // (開発用フォールバック: もしID:1で強制的に動かしたい場合はここを残すが、基本は上のredirectでOK)
        // user = userRepository.findById(1L).orElse(...); 
        
        // 念のためRoleをセット（DBに保存されていない場合もあるため）
        if (user.getRole() == null) user.setRole("TEACHER");
        // =================================================================

        // 2. ソートとフィルタリングの設定
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        List<Exam> createdExams;

        if (filterSubjectId != null) {
            createdExams = examRepository.findAll(sort).stream()
                .filter(e -> e.getSubjectId() != null && e.getSubjectId().equals(filterSubjectId))
                .collect(Collectors.toList());
        } else {
            createdExams = examRepository.findAll(sort);
        }

        // 3. モデルへの追加
        List<Subject> allSubjects = subjectRepository.findAll();

        model.addAttribute("user", user);
        model.addAttribute("exams", createdExams);
        model.addAttribute("allSubjects", allSubjects);
        model.addAttribute("currentFilter", filterSubjectId);
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentSortDir", sortDir);

        return "teacher_home";
    }

    // ... (他のメソッド showExamResults などはそのまま) ...
    @GetMapping("/exam/results/{examId}")
    public String showExamResults(@PathVariable Long examId, Model model) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("無効な試験IDです"));
        List<ExamResult> results = examResultRepository.findByExamId(examId);
        double averageScore = results.stream()
                .mapToInt(ExamResult::getScore)
                .average()
                .orElse(0.0);
        model.addAttribute("exam", exam);
        model.addAttribute("results", results);
        model.addAttribute("averageScore", String.format("%.1f", averageScore));
        return "exam_results_list";
    }
}