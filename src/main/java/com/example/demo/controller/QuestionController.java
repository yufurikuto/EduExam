package com.example.demo.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.demo.entity.Exam;
import com.example.demo.entity.Option;
import com.example.demo.entity.Question;
import com.example.demo.repository.ExamRepository;
import com.example.demo.repository.OptionRepository;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.service.QuestionService; 

@Controller
@RequestMapping("/exam/create")
public class QuestionController {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private OptionRepository optionRepository; 
    
    @Autowired
    private QuestionService questionService; 
    
    // 問題タイプ一覧の定義
    private static final List<String> QUESTION_TYPES = Arrays.asList(
            "MULTIPLE_CHOICE", 
            "TEXT",            
            "TRUE_FALSE",      
            "ORDERING",        
            "MATCHING"         
    );


    /**
     * ステップ2：問題設定画面を表示する (新規作成/一覧表示)
     */
    @GetMapping("/questions/{examId}")
    public String showQuestionManagement(
            @PathVariable Long examId, 
            Model model) {

        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty()) {
            model.addAttribute("error", "指定された試験が見つかりません。");
            return "error_page"; 
        }
        Exam exam = examOpt.get();

        Sort sort = Sort.by(Sort.Direction.ASC, "sequenceNumber");
        List<Question> existingQuestions = questionRepository.findByExamId(examId, sort); 
        
        List<Question> allQuestions = questionRepository.findAll();

        model.addAttribute("exam", exam);
        model.addAttribute("questions", existingQuestions);
        model.addAttribute("newQuestion", new Question()); 
        model.addAttribute("questionTypes", QUESTION_TYPES); 
        model.addAttribute("isEditMode", false); 
        model.addAttribute("allQuestions", allQuestions);

        return "exam_questions"; 
    }
    
    /**
     * 問題プール管理画面を表示する (ソートとフィルタリングに対応)
     */
    @GetMapping("/question/manage")
    public String showQuestionPoolManagement(
            Model model,
            @RequestParam(defaultValue = "id") String sortBy, 
            @RequestParam(defaultValue = "asc") String sortDir, 
            @RequestParam(required = false) String filterQuestionType) {
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        List<Question> allQuestions = questionRepository.findAll(sort); 

        if (filterQuestionType != null && !filterQuestionType.isEmpty() && !"ALL".equals(filterQuestionType)) {
            allQuestions = allQuestions.stream()
                .filter(q -> q.getQuestionType().equals(filterQuestionType))
                .collect(Collectors.toList());
        }

        model.addAttribute("questions", allQuestions);
        model.addAttribute("questionTypes", QUESTION_TYPES); 
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentSortDir", sortDir);
        model.addAttribute("currentFilterType", filterQuestionType);

        return "question_manage"; 
    }
    
    /**
     * 問題編集フォームの表示
     */
    @GetMapping("/editQuestion/{questionId}") 
    public String showEditQuestionForm(
            @PathVariable Long questionId,
            Model model) {
        
        Optional<Question> questionOpt = questionRepository.findById(questionId);
        if (questionOpt.isEmpty()) {
            model.addAttribute("error", "問題が見つかりません。");
            return "error_page";
        }
        Question question = questionOpt.get();
        
        Optional<Exam> examOpt = question.getExamId() != null 
            ? examRepository.findById(question.getExamId()) 
            : Optional.empty(); 
        Exam exam = examOpt.orElse(null); 

        // 選択肢/マッチング要素のデータを取得し、モデルに追加 (JavaScriptで使用)
        List<Option> options = List.of();
        if ("MULTIPLE_CHOICE".equals(question.getQuestionType()) || "MATCHING".equals(question.getQuestionType())) { 
            options = optionRepository.findByQuestionId(questionId);
            model.addAttribute("options", options); 
        }
        
        Sort sort = Sort.by(Sort.Direction.ASC, "sequenceNumber");
        List<Question> existingQuestions = (exam != null) 
            ? questionRepository.findByExamId(exam.getId(), sort) 
            : List.of(question); 

        List<Question> allQuestions = questionRepository.findAll();

        model.addAttribute("exam", exam); 
        model.addAttribute("questions", existingQuestions); 
        model.addAttribute("newQuestion", question); 
        model.addAttribute("questionTypes", QUESTION_TYPES);
        model.addAttribute("isEditMode", true); 
        model.addAttribute("allQuestions", allQuestions);

        return "exam_questions"; 
    }
    
    /**
     * 問題の詳細データ（問題とオプション）をJSONで返すAPI
     */
    @GetMapping("/getQuestionDetail/{questionId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getQuestionDetail(@PathVariable Long questionId) {
        Optional<Question> questionOpt = questionRepository.findById(questionId);
        
        if (questionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "問題が見つかりません。"));
        }
        
        Question question = questionOpt.get();
        
        // 関連するオプションデータを取得
        List<Option> options = optionRepository.findByQuestionId(questionId);
        
        // 問題とオプションをマップに詰めて返す
        Map<String, Object> response = Map.of(
            "question", question,
            "options", options
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 空の新しい問題を作成するAPI
     */
    @PostMapping("/createEmptyQuestion")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createEmptyQuestion(@RequestParam Long examId) {
        try {
            Question newQuestion = new Question();
            newQuestion.setExamId(examId);
            newQuestion.setQuestionText("新しい問題"); // デフォルトのテキスト
            newQuestion.setQuestionType("MULTIPLE_CHOICE"); // デフォルトの形式
            newQuestion.setScore(10); // デフォルトの配点
            
            // シーケンス番号を最後に設定
            Sort sort = Sort.by(Sort.Direction.DESC, "sequenceNumber");
            List<Question> existingQuestions = questionRepository.findByExamId(examId, sort);
            int maxSequence = existingQuestions.isEmpty() ? 0 : existingQuestions.get(0).getSequenceNumber();
            newQuestion.setSequenceNumber(maxSequence + 1);
            
            Question savedQuestion = questionRepository.save(newQuestion);
            
            // デフォルトの選択肢を作成
            Option opt1 = new Option();
            opt1.setQuestionId(savedQuestion.getId());
            opt1.setOptionText("選択肢 1");
            optionRepository.save(opt1);
            
            Option opt2 = new Option();
            opt2.setQuestionId(savedQuestion.getId());
            opt2.setOptionText("選択肢 2");
            optionRepository.save(opt2);
            
            return ResponseEntity.ok(Map.of(
                "message", "新しい問題を作成しました。",
                "questionId", savedQuestion.getId()
            ));
            
        } catch (Exception e) {
            System.err.println("新規作成エラー: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "問題作成中にエラーが発生しました。"));
        }
    }
    
    /**
     * 問題を複製するAPI
     */
    @PostMapping("/duplicateQuestion/{questionId}")
    @ResponseBody
    public ResponseEntity<Map<String, String>> duplicateQuestion(@PathVariable Long questionId) {
        Optional<Question> originalQuestionOpt = questionRepository.findById(questionId);
        
        if (originalQuestionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(Map.of("error", "複製元問題が見つかりません。"));
        }
        
        Question original = originalQuestionOpt.get();
        
        try {
            // 1. 問題のコピー
            Question newQuestion = new Question();
            newQuestion.setExamId(original.getExamId());
            newQuestion.setQuestionText(original.getQuestionText() + " (コピー)"); 
            newQuestion.setQuestionType(original.getQuestionType());
            newQuestion.setCorrectAnswer(original.getCorrectAnswer());
            newQuestion.setScore(original.getScore());
            
            Sort sort = Sort.by(Sort.Direction.DESC, "sequenceNumber");
            List<Question> existingQuestions = questionRepository.findByExamId(original.getExamId(), sort);
            int maxSequence = existingQuestions.isEmpty() ? 0 : existingQuestions.get(0).getSequenceNumber();
            newQuestion.setSequenceNumber(maxSequence + 1);
            
            Question savedQuestion = questionRepository.save(newQuestion);
            
            // 2. 選択肢のコピー
            if ("MULTIPLE_CHOICE".equals(original.getQuestionType()) || "MATCHING".equals(original.getQuestionType())) {
                List<Option> originalOptions = optionRepository.findByQuestionId(questionId);
                
                for (Option originalOpt : originalOptions) {
                    Option newOption = new Option();
                    newOption.setQuestionId(savedQuestion.getId()); 
                    newOption.setOptionText(originalOpt.getOptionText());
                    newOption.setCorrect(originalOpt.isCorrect());
                    optionRepository.save(newOption);
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "問題が正常に複製されました。", "newQuestionId", savedQuestion.getId().toString()));
            
        } catch (Exception e) {
            System.err.println("問題複製エラー: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "問題複製中にエラーが発生しました。"));
        }
    }


    /**
     * 問題の順序を更新する API
     */
    @PostMapping("/updateOrder") 
    @ResponseBody 
    public ResponseEntity<Map<String, String>> updateQuestionOrder(
            @RequestParam Long examId,
            @RequestParam List<Long> orderedQuestionIds) {
        
        try {
            questionService.updateQuestionOrder(examId, orderedQuestionIds); 
            
            return ResponseEntity.ok(Map.of("message", "順序を正常に更新しました。", "examId", examId.toString()));
            
        } catch (Exception e) {
            System.err.println("順序更新エラー: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "順序更新中にエラーが発生しました。"));
        }
    }


    /**
     * 新しい問題の追加 (POST) / 既存の問題の更新 (PUT/POST)
     * (同期リクエスト用: 従来通りリダイレクトを行う)
     */
    @PostMapping("/addQuestion") 
    public String saveOrUpdateQuestion(
            @ModelAttribute Question question,
            @RequestParam(required = false) Long examId, 
            @RequestParam Map<String, String> formData,
            @RequestParam(required = false, name = "correctOptionIndexes") List<String> correctOptionIndexes,
            RedirectAttributes redirectAttributes) {

        Long finalExamId = examId;
        if (finalExamId == null && question.getId() != null) {
            Optional<Question> existingQuestion = questionRepository.findById(question.getId());
            if (existingQuestion.isPresent()) {
                finalExamId = existingQuestion.get().getExamId();
            }
        }

        try {
            if (finalExamId != null) {
                question.setExamId(finalExamId); 
            } else {
                question.setExamId(null); 
            }
            
            Question savedQuestion = questionService.saveQuestionAndOptions(question, formData, correctOptionIndexes);
            
            String message = (question.getId() == null) ? "問題が正常に追加されました。" : "問題が正常に更新されました。";
            redirectAttributes.addFlashAttribute("message", message);
            
            if (finalExamId != null) {
                 return "redirect:/exam/create/questions/" + finalExamId;
            } else {
                 return "redirect:/exam/create/question/manage";
            }

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "問題の保存中にエラーが発生しました。");
            if (finalExamId != null) {
                 return "redirect:/exam/create/questions/" + finalExamId;
            } else {
                 return "redirect:/exam/create/question/manage";
            }
        }
    }
    
    /**
     * ★新規追加: 非同期(AJAX)で問題を保存・更新するAPI
     * 画面リロードなしでデータを保存するために使用します。
     */
    @PostMapping("/updateQuestionAjax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateQuestionAjax(
            @ModelAttribute Question question,
            @RequestParam(required = false) Long examId,
            @RequestParam Map<String, String> formData,
            @RequestParam(required = false, name = "correctOptionIndexes") List<String> correctOptionIndexes) {

        try {
            // 試験IDの補完ロジック
            if (examId == null && question.getId() != null) {
                Optional<Question> existingQuestion = questionRepository.findById(question.getId());
                if (existingQuestion.isPresent()) {
                    examId = existingQuestion.get().getExamId();
                }
            }
            question.setExamId(examId);

            // サービス層を通して保存処理を実行
            Question savedQuestion = questionService.saveQuestionAndOptions(question, formData, correctOptionIndexes);

            // 成功レスポンス
            return ResponseEntity.ok(Map.of(
                "message", "保存しました",
                "question", savedQuestion
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "保存中にエラーが発生しました: " + e.getMessage()));
        }
    }
    
    /**
     * 既存の問題を新しい試験にインポートするAPI
     */
    @PostMapping("/importQuestions") 
    public String importQuestions(
            @RequestParam Long targetExamId,
            @RequestParam List<Long> questionIdsToImport, 
            RedirectAttributes redirectAttributes) {

        int importedCount = 0;
        
        try {
            for (Long originalQuestionId : questionIdsToImport) {
                Optional<Question> originalQuestionOpt = questionRepository.findById(originalQuestionId);
                
                if (originalQuestionOpt.isPresent()) {
                    Question original = originalQuestionOpt.get();
                    
                    // 1. 問題のコピー
                    Question newQuestion = new Question();
                    newQuestion.setExamId(targetExamId);
                    newQuestion.setQuestionText(original.getQuestionText());
                    newQuestion.setQuestionType(original.getQuestionType());
                    newQuestion.setCorrectAnswer(original.getCorrectAnswer());
                    newQuestion.setScore(original.getScore());
                    
                    Question savedQuestion = questionRepository.save(newQuestion);
                    
                    // 2. 選択肢のコピー
                    if ("MULTIPLE_CHOICE".equals(original.getQuestionType()) || "MATCHING".equals(original.getQuestionType())) {
                        List<Option> originalOptions = optionRepository.findByQuestionId(originalQuestionId);
                        
                        for (Option originalOpt : originalOptions) {
                            Option newOption = new Option();
                            newOption.setQuestionId(savedQuestion.getId()); 
                            newOption.setOptionText(originalOpt.getOptionText());
                            newOption.setCorrect(originalOpt.isCorrect());
                            optionRepository.save(newOption);
                        }
                    }
                    importedCount++;
                }
            }
            
            redirectAttributes.addFlashAttribute("message", importedCount + "問の問題を正常にインポートしました。");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "問題のインポート中にエラーが発生しました: " + e.getMessage());
        }

        return "redirect:/exam/create/questions/" + targetExamId;
    }
    
    /**
     * 問題の削除 
     */
    @PostMapping("/deleteQuestion/{questionId}") 
    public String deleteQuestion(
            @PathVariable Long questionId,
            @RequestParam(required = false) Long examId, 
            RedirectAttributes redirectAttributes) {
        
        try {
            questionService.deleteQuestion(questionId);
            redirectAttributes.addFlashAttribute("message", "問題が正常に削除されました。");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "問題の削除中にエラーが発生しました。");
        }
        
        if (examId != null) {
            return "redirect:/exam/create/questions/" + examId;
        } else {
            return "redirect:/exam/create/question/manage";
        }
    }
}