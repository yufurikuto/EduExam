package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.entity.Exam;
import com.example.demo.entity.ExamResult;
import com.example.demo.entity.Option;
import com.example.demo.entity.Question;
import com.example.demo.entity.User; // Userを追加
import com.example.demo.repository.ExamRepository;
import com.example.demo.repository.ExamResultRepository;
import com.example.demo.repository.OptionRepository;
import com.example.demo.repository.QuestionRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession; // Sessionを追加

@Controller
@RequestMapping("/student/exam")
public class StudentExamController {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private OptionRepository optionRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;

    /**
     * 受験画面を表示する
     */
    @GetMapping("/{examId}")
    public String takeExam(@PathVariable Long examId, Model model, HttpSession session) {
        // ★修正: ログインチェック
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return "redirect:/login"; // ログインしていなければログイン画面へ
        }

        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty()) {
            return "error_page";
        }
        Exam exam = examOpt.get();

        Sort sort = Sort.by(Sort.Direction.ASC, "sequenceNumber");
        List<Question> questions = questionRepository.findByExamId(examId, sort);

        Map<Long, List<Option>> optionsMap = new HashMap<>();
        for (Question q : questions) {
            if ("MULTIPLE_CHOICE".equals(q.getQuestionType()) || "MATCHING".equals(q.getQuestionType())) {
                List<Option> opts = optionRepository.findByQuestionId(q.getId());
                optionsMap.put(q.getId(), opts);
            }
        }

        model.addAttribute("exam", exam);
        model.addAttribute("questions", questions);
        model.addAttribute("optionsMap", optionsMap);
        model.addAttribute("user", user); // 画面表示用にユーザー情報も渡す

        return "take_exam";
    }

    /**
     * 回答を送信し、採点を行う
     */
    @PostMapping("/submit")
    public String submitExam(
            @RequestParam Long examId, 
            HttpServletRequest request, 
            HttpSession session, // ★修正: セッション追加
            Model model) {
        
        // ★修正: ログインユーザーを取得
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return "redirect:/login";
        }

        // 1. 試験と問題データを取得
        List<Question> questions = questionRepository.findByExamId(examId, Sort.by(Sort.Direction.ASC, "sequenceNumber"));
        
        int totalScore = 0;
        int earnedScore = 0;

        // 2. 問題ごとに採点ループ
        for (Question q : questions) {
            int qScore = q.getScore();
            totalScore += qScore;
            boolean isCorrect = false;

            String paramName = "answers[" + q.getId() + "]";
            String[] userAnswers = request.getParameterValues(paramName); 

            if (userAnswers == null) userAnswers = new String[0];

            if ("MULTIPLE_CHOICE".equals(q.getQuestionType())) {
                List<Option> options = optionRepository.findByQuestionId(q.getId());
                Set<String> correctOptionIds = options.stream()
                        .filter(Option::isCorrect)
                        .map(opt -> String.valueOf(opt.getId()))
                        .collect(Collectors.toSet());
                
                Set<String> userAnswerSet = Set.of(userAnswers);

                if (correctOptionIds.equals(userAnswerSet)) {
                    isCorrect = true;
                }
            } else {
                if (userAnswers.length > 0 && userAnswers[0].equals(q.getCorrectAnswer())) {
                    isCorrect = true;
                }
            }

            if (isCorrect) {
                earnedScore += qScore;
            }
        }

        // 3. 結果をDBに保存
        ExamResult result = new ExamResult();
        result.setExamId(examId);
        result.setStudentId(user.getId()); // ★修正: 本当のユーザーIDをセット
        result.setScore(earnedScore);
        result.setTotalScore(totalScore);
        examResultRepository.save(result);

        return "redirect:/student/exam/finished?resultId=" + result.getId();
    }
    
    @GetMapping("/finished")
    public String showFinishedPage(@RequestParam Long resultId, Model model) {
        Optional<ExamResult> resultOpt = examResultRepository.findById(resultId);
        
        if (resultOpt.isPresent()) {
            model.addAttribute("result", resultOpt.get());
            Optional<Exam> examOpt = examRepository.findById(resultOpt.get().getExamId());
            examOpt.ifPresent(exam -> model.addAttribute("examTitle", exam.getTitle()));
        }
        return "exam_finished";
    }
}