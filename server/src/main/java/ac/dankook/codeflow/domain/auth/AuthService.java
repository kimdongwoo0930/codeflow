package ac.dankook.codeflow.domain.auth;

import java.util.Random;
import java.util.concurrent.TimeUnit;

import jakarta.transaction.Transactional;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.auth.dto.SignupResponse;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.userRepository;
import ac.dankook.codeflow.global.config.MailForm;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final userRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;

    /**
     * 회원가입
     *
     * 1. 이메일 중복 체크 (userRepository.existsByEmail)
     * 2. 비밀번호 BCrypt 암호화 (passwordEncoder.encode)
     * 3. User 엔티티 생성 (loginType=EMAIL, role=ROLE_USER, emailVerified=false)
     * 4. DB 저장
     * 완료
     */
    public SignupResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_USER_EMAIL);
        }
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.from(request, encodedPassword);
        userRepository.save(user);
        return SignupResponse.of(user);
    }

    /**
     * 이메일 인증 코드 발송
     *
     * 1. 6자리 난수 인증 코드 생성
     * 2. Redis에 저장
     * - key : "email:verify:{email}"
     * - value: 인증 코드
     * - TTL : 5분
     * 3. 이메일 발송 (제목: "[Codeflow] 이메일 인증", 본문: 인증 코드)
     */
    public void sendVerificationCode(String email) {
        String randomCode = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue()
                .set(email, randomCode, 3, TimeUnit.MINUTES);
        mailSender.send(MailForm.verificationCode(email, randomCode));
    }

    /**
     * 이메일 인증 코드 확인
     *
     * 1. Redis에서 key "email:verify:{email}"로 저장된 코드 조회
     * 2. 코드 불일치 또는 만료 시 예외 발생
     * 3. User.emailVerified = true 업데이트
     * 4. Redis 키 삭제
     */
    public void verifyCode(String email, String code) {
        String savedCode = redisTemplate.opsForValue().get(email);
        // 만료 (Redis에 키가 없음)
        if (savedCode == null) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_EXPIRED);
        }

        // 불일치
        if (!savedCode.equals(code)) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_INVALID);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        user.verifyEmail();

        redisTemplate.delete(email);
    }
}
