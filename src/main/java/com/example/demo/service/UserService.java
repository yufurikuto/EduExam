package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ★修正: role (TEACHER or STUDENT) を受け取れるように変更
    public User registerUser(String username, String password, String email, String role) {
        
        // 重複チェック (ID または メールアドレス)
        if (userRepository.findByUsername(username) != null) {
            throw new RuntimeException("このユーザーIDは既に使用されています");
        }
        if (userRepository.findByEmail(email) != null) {
            throw new RuntimeException("このメールアドレスは既に使用されています");
        }

        // ユーザー作成
        User user = new User(username, password, email);
        user.setRole(role); // 役割をセット
        
        return userRepository.save(user);
    }

    public User loginUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        throw new RuntimeException("ユーザー名またはパスワードが間違っています");
    }
}