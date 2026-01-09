package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.Option;
import com.example.demo.entity.Question;
import com.example.demo.repository.OptionRepository;
import com.example.demo.repository.QuestionRepository;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private OptionRepository optionRepository;

    /**
     * 問題とその選択肢を保存/更新する
     */
    @Transactional
    public Question saveQuestionAndOptions(
            Question question, 
            Map<String, String> formData, 
            List<String> correctOptionIndexes) {
        
        Question savedQuestion = questionRepository.save(question);
        Long questionId = savedQuestion.getId();
        String questionType = savedQuestion.getQuestionType();

        // ★新規作成時の sequenceNumber 設定ロジック
        if (question.getId() == null) {
            // 対象の試験に紐づく現在の最大順序番号を取得し、+1する
            Integer maxSeq = questionRepository.findAll().stream()
                .filter(q -> question.getExamId() != null && question.getExamId().equals(q.getExamId()))
                .map(Question::getSequenceNumber)
                .filter(s -> s != null)
                .max(Integer::compare)
                .orElse(0);
                
            question.setSequenceNumber(maxSeq + 1);
            savedQuestion = questionRepository.save(question); // sequenceNumberを更新して再保存
            questionId = savedQuestion.getId();
        }


        // 既存の選択肢をすべて削除（更新時に必要）
        optionRepository.deleteAll(optionRepository.findByQuestionId(questionId));

        // 問題タイプに応じて処理を分岐
        if ("MULTIPLE_CHOICE".equals(questionType)) {
            
            Set<Integer> correctIndexes = correctOptionIndexes != null ? 
                                          correctOptionIndexes.stream().map(Integer::parseInt).collect(Collectors.toSet()) :
                                          Set.of(); 

            if (correctIndexes.isEmpty()) {
                throw new IllegalArgumentException("選択式問題では、少なくとも1つの正解を選択してください。");
            }
            
            for (int i = 1; ; i++) {
                String optionText = formData.get("optionText_" + i);
                if (optionText == null) break;

                Option option = new Option();
                option.setQuestionId(questionId);
                option.setOptionText(optionText);
                option.setCorrect(correctIndexes.contains(i)); 
                optionRepository.save(option);
            }
        } 
        
        // マッチング問題の処理 (L/R要素の保存とペアリングデータの保存)
        if ("MATCHING".equals(questionType)) {
            
            // 1. 要素の収集 (L/R)
            List<String> leftElements = new ArrayList<>();
            List<String> rightElements = new ArrayList<>();
            // ... (要素収集ロジックは省略 - formDataから matching_element_L_1, matching_element_R_1 などを取得) ...
            int i = 1;
            while (true) {
                String leftText = formData.get("matching_element_L_" + i);
                String rightText = formData.get("matching_element_R_" + i);
                
                if (leftText == null && rightText == null && i > 1) break;
                
                if (leftText != null) {
                    leftElements.add(leftText);
                }
                
                if (rightText != null) {
                    rightElements.add(rightText);
                }
                
                i++;
                if (i > 100) break; 
            }

            if (leftElements.size() != rightElements.size() || leftElements.isEmpty()) {
                 throw new IllegalArgumentException("マッチング問題は、左右同数の要素（1つ以上）が必要です。");
            }

            // 2. Optionテーブルに保存
            for (int j = 0; j < leftElements.size(); j++) {
                Option option = new Option();
                option.setQuestionId(questionId);
                option.setOptionText("L" + (j + 1) + ":" + leftElements.get(j)); 
                option.setCorrect(false); 
                optionRepository.save(option);
            }
            for (int j = 0; j < rightElements.size(); j++) {
                Option option = new Option();
                option.setQuestionId(questionId);
                option.setOptionText("R" + (j + 1) + ":" + rightElements.get(j)); 
                option.setCorrect(false);
                optionRepository.save(option);
            }
            
            // 3. 正解ペアリング情報（"L1-R3,L2-R1"など）をQuestion.correctAnswerに保存
            String pairingData = formData.get("matchingPairs"); 
            if (pairingData == null || pairingData.isEmpty()) {
                throw new IllegalArgumentException("マッチング問題のペアリング情報が不足しています。");
            }
            savedQuestion.setCorrectAnswer(pairingData);
            questionRepository.save(savedQuestion);
        }
        
        return savedQuestion;
    }
    
    /**
     * 試験に紐づく問題の順序を、IDリストの順に更新する
     */
    @Transactional
    public void updateQuestionOrder(Long examId, List<Long> orderedQuestionIds) {
        
        for (int i = 0; i < orderedQuestionIds.size(); i++) {
            Long questionId = orderedQuestionIds.get(i);
            int newSequenceNumber = i + 1; 

            Optional<Question> questionOpt = questionRepository.findById(questionId);

            if (questionOpt.isPresent()) {
                Question question = questionOpt.get();
                
                if (!examId.equals(question.getExamId())) { 
                    System.err.println("不正な順序更新リクエスト: 問題ID " + questionId + " は試験ID " + examId + " に紐づいていません。");
                    continue; 
                }
                
                question.setSequenceNumber(newSequenceNumber);
                questionRepository.save(question);
            }
        }
    }
    
    /**
     * 問題を削除する
     */
    @Transactional
    public void deleteQuestion(Long questionId) {
        // 関連する選択肢を削除
        optionRepository.deleteAll(optionRepository.findByQuestionId(questionId));
        // 問題本体を削除
        questionRepository.deleteById(questionId);
    }
}