package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    
    User findByUsername(String username);

    User findByEmail(String email);

    // ★新規追加: ユーザー名 または メールアドレス で検索
    // (引数を2つ渡しますが、呼び出すときは同じ値を2回渡して「どちらかに一致すればOK」とします)
    User findByUsernameOrEmail(String username, String email);
}