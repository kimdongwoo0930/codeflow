package ac.dankook.codeflow.domain.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.auth.dto.SignupResponse;
import ac.dankook.codeflow.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     * POST /api/auth/signup
     *
     * 1. SignupRequest 유효성 검사
     * 2. AuthService.signup() 호출
     * 3. 성공 시 201 Created 반환
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(authService.signup(request)));
    }

    /**
     * 이메일 인증 코드 발송
     * POST /api/auth/email/send
     *
     * 1. 이메일 주소 받기
     * 2. AuthService.sendVerificationCode() 호출
     * - 인증 코드 생성
     * - Redis에 저장 (key: "email:verify:{email}", TTL: 5분)
     * - 이메일 발송
     * 3. 성공 시 200 OK 반환
     */
    @PostMapping("/email/send")
    public ResponseEntity<?> sendVerificationCode(@RequestParam String email) {
        authService.sendVerificationCode(email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 이메일 인증 코드 확인
     * POST /api/auth/email/verify
     *
     * 1. 이메일 + 인증 코드 받기
     * 2. AuthService.verifyCode() 호출
     * - Redis에서 코드 조회
     * - 일치하면 User.emailVerified = true 업데이트
     * - Redis 키 삭제
     * 3. 성공 시 200 OK 반환
     */
    @PostMapping("/email/verify")
    public ResponseEntity<?> verifyCode(@RequestParam String email, @RequestParam String code) {
        authService.verifyCode(email, code);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
