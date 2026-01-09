package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.service.UserService;

@Controller
public class RegisterController {

    @Autowired
    private UserService userService;

    // 登録画面の表示
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    // 登録処理
    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String role,
            Model model) {

        try {
            // サービスを使って登録
            userService.registerUser(username, password, email, role);
            
            // 成功したらログイン画面へリダイレクト（登録完了メッセージ付き）
            return "redirect:/login?registered";

        } catch (Exception e) {
            // 失敗したらエラーメッセージを出して元の画面に戻る
            model.addAttribute("error", e.getMessage());
            model.addAttribute("username", username);
            model.addAttribute("email", email);
            return "register";
        }
    }
}