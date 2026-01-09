package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Exam;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    //
}