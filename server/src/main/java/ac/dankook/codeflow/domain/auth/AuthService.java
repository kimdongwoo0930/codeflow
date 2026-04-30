package ac.dankook.codeflow.domain.auth;

import java.util.Random;
import java.util.concurrent.TimeUnit;
import jakarta.transaction.Transactional;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ac.dankook.codeflow.domain.auth.dto.LoginRequest;
import ac.dankook.codeflow.domain.auth.dto.LoginResponse;
import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.auth.dto.SignupResponse;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.UserRepository;
import ac.dankook.codeflow.global.config.MailForm;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import ac.dankook.codeflow.global.security.JwtProvider;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider JwtProvider;

    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;

    private static final String CODE_PREFIX = "email:code:";
    private static final String VERIFIED_PREFIX = "email:verified:";

    /**
     * 회원가입
     *
     * 1. 이메일 중복 체크 (userRepository.existsByEmail) 2. 비밀번호 BCrypt 암호화 (passwordEncoder.encode) 3.
     * User 엔티티 생성 (loginType=EMAIL, role=ROLE_USER, emailVerified=false) 4. DB 저장 완료
     */
    public SignupResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_USER_EMAIL);
        }
        String status = redisTemplate.opsForValue().get(VERIFIED_PREFIX + request.email());
        if (!"verified".equals(status)) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_EXPIRED);
        }
        String encodedPassword = passwordEncoder.encode(request.password());
        User user = User.from(request, encodedPassword);
        userRepository.save(user);
        redisTemplate.delete(VERIFIED_PREFIX + request.email());
        return SignupResponse.of(user);
    }

    /**
     * 이메일 인증 코드 발송
     *
     * 1. 6자리 난수 인증 코드 생성 2. Redis에 저장 - key : "email:verify:{email}" - value: 인증 코드 - TTL : 3분 3.
     * 이메일 발송 (제목: "[Codeflow] 이메일 인증", 본문: 인증 코드)
     */
    public void sendVerificationCode(String email) {
        String randomCode = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue().set(CODE_PREFIX + email, randomCode, 3, TimeUnit.MINUTES);
        mailSender.send(MailForm.verificationCode(email, randomCode));
    }

    /**
     * 이메일 인증 코드 확인
     *
     * 1. Redis에서 key "email:verify:{email}"로 저장된 코드 조회 2. 코드 불일치 또는 만료 시 예외 발생 3.
     * User.emailVerified = true 업데이트 4. Redis 키 삭제 5. 이메일 인증을 성공했을경우 redis에 이메일: true 로 한 10분정도남겨두고
     * 만약 회원가입을 할경우 redis안에 아이디가 있다면 회원가입 성공 없다면 만료된 인증또는 인증받지 못한 이메일이라고 반환한다.
     * 
     */
    public void verifyCode(String email, String code) {
        String savedCode = redisTemplate.opsForValue().get(CODE_PREFIX + email);
        // 만료 (Redis에 키가 없음)
        if (savedCode == null) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_EXPIRED);
        }

        // 불일치
        if (!savedCode.equals(code)) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_INVALID);
        }

        redisTemplate.delete(CODE_PREFIX + email);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + email, "verified", 10, TimeUnit.MINUTES);
    }


    /**
     * 로그인
     *
     * 1. 이메일이 먼저 DB에 있는지 확인하기 2. 있다면 가져와서 비밀번호를 암호화후 DB에 있는 암호화된 비밀번호와 비교
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
        String accessToken = JwtProvider.generateAccessToken(user.getId(), user.getEmail(),
                user.getRole().toString());
        return LoginResponse.of(accessToken);

    }
}

