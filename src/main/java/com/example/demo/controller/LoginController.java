package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@Controller
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    // ログイン画面表示
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    // ログイン処理
    @PostMapping("/login")
    public String login(
            // ★変更: email ではなく identifier (IDまたはメアド) として受け取る
            @RequestParam String identifier, 
            @RequestParam String password, 
            HttpSession session) {
        
        // ★変更: ユーザー名 OR メールアドレス で検索
        // (同じ値を2回渡すことで「ユーザー名が identifier と一致 または メールが identifier と一致」を探す)
        User user = userRepository.findByUsernameOrEmail(identifier, identifier);

        if (user != null && user.getPassword().equals(password)) {
            // ログイン成功: セッションに保存
            session.setAttribute("currentUser", user);
            
            // 役割に応じてリダイレクト
            if ("TEACHER".equals(user.getRole())) {
                return "redirect:/teacher_home";
            } else {
                return "redirect:/student/home"; // 学生ホーム（未作成なら teacher_home へ）
            }
        } else {
            // ログイン失敗
            return "redirect:/login?error";
        }
    }

    // ログアウト処理
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}