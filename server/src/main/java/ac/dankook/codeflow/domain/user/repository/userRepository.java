package ac.dankook.codeflow.domain.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ac.dankook.codeflow.domain.user.entity.User;

public interface userRepository extends JpaRepository<User, Long> { // 버그 수정: <Long, User> → <User, Long>

    // 이메일로 사용자 조회 (회원가입 중복 체크, 로그인 등에서 사용)
    Optional<User> findByEmail(String email);

    // 이메일 존재 여부 확인 (회원가입 중복 체크)
    boolean existsByEmail(String email);
}
