package com.example.demo.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Subject;
import com.example.demo.repository.SubjectRepository;

@RestController
@RequestMapping("/api/subjects")
public class SubjectApiController {

    @Autowired
    private SubjectRepository subjectRepository;

    @PostMapping("/add")
    public ResponseEntity<?> addSubject(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String description = request.get("description");
            
            if (name == null || name.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "科目名は必須です"));
            }
            
            Subject subject = new Subject();
            subject.setName(name);
            subject.setDescription(description != null ? description : name);
            
            Subject savedSubject = subjectRepository.save(subject);
            
            return ResponseEntity.ok(Map.of("message", "科目登録成功", "subject", savedSubject));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "サーバーエラー: " + e.getMessage()));
        }
    }
    
    @PostMapping("/delete")
    public ResponseEntity<?> deleteSubject(@RequestBody Map<String, Long> request) {
        try {
            Long subjectId = request.get("id");
            
            if (subjectId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "科目IDは必須です"));
            }

            Optional<Subject> subjectOpt = subjectRepository.findById(subjectId);
            if (subjectOpt.isEmpty()) {
                 return ResponseEntity.status(404).body(Map.of("error", "指定された科目IDが見つかりません"));
            }
            
            // 関連チェックは省略
            
            subjectRepository.deleteById(subjectId);
            
            return ResponseEntity.ok(Map.of("message", "科目削除成功", "id", subjectId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "サーバーエラー: " + e.getMessage()));
        }
    }
}