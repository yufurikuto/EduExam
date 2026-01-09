package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.ExamResult;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    // 学生IDで検索 (学生が自分の履歴を見る用)
    List<ExamResult> findByStudentId(Long studentId);
    
    // ★新規追加: 試験IDで検索 (先生が成績一覧を見る用)
    List<ExamResult> findByExamId(Long examId);
}