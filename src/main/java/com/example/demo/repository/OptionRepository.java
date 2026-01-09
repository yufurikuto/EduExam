package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Option;

public interface OptionRepository extends JpaRepository<Option, Long> {
    // 問題IDに基づいて選択肢リストを取得するカスタムメソッド
    List<Option> findByQuestionId(Long questionId);
}