package ac.dankook.codeflow.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import ac.dankook.codeflow.domain.auth.dto.LoginRequest;
import ac.dankook.codeflow.domain.auth.dto.LoginResponse;
import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.auth.dto.SignupResponse;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.UserRepository;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import ac.dankook.codeflow.global.security.JwtProvider;

@ExtendWith(MockitoExtension.class) // Spring 없이 Mockito만으로 실행
class AuthServiceTest {

    // ✅ 테스트 대상: 진짜 객체
    @InjectMocks
    private AuthService authService;

    // ✅ 의존성들: 전부 가짜(Mock) 객체
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private JavaMailSender mailSender;

    // Redis ValueOperations Mock (redisTemplate.opsForValue() 반환값)
    @Mock
    private ValueOperations<String, String> valueOperations;

    // 테스트마다 공통으로 쓰는 요청 객체
    private SignupRequest signupRequest;

    @BeforeEach
    void setUp() {
        signupRequest = new SignupRequest("test@test.com", "password123", "tester");
    }

    // ==================== signup() 테스트 ====================

    @Test
    @DisplayName("회원가입 성공")
    void signup_성공() {
        // given
        given(userRepository.existsByEmail("test@test.com")).willReturn(false);
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("email:verified:test@test.com")).willReturn("verified");
        given(passwordEncoder.encode("password123")).willReturn("encodedPassword");

        // when
        SignupResponse response = authService.signup(signupRequest);

        // then
        assertThat(response.email()).isEqualTo("test@test.com");
        assertThat(response.nickname()).isEqualTo("tester");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("회원가입 실패 - 이미 가입된 이메일")
    void signup_중복이메일_예외() {
        // given: 이미 이메일이 존재하는 상황
        given(userRepository.existsByEmail("test@test.com")).willReturn(true);

        // when & then: 예외가 발생해야 함
        assertThatThrownBy(() -> authService.signup(signupRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DUPLICATE_USER_EMAIL);

        // save()는 절대 호출되면 안 됨
        verify(userRepository, never()).save(any());
    }

    // ==================== sendVerificationCode() 테스트 ====================

    @Test
    @DisplayName("이메일 인증 코드 발송 성공")
    void sendVerificationCode_성공() {
        // given
        // redisTemplate.opsForValue()가 호출되면 valueOperations Mock을 반환하도록 설정
        // 힌트: given(redisTemplate.opsForValue()).willReturn(???)
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        // when
        // authService.sendVerificationCode("test@test.com") 호출
        authService.sendVerificationCode("test@test.com");
        // then
        // 1. redisTemplate.opsForValue().set()이 1번 호출됐는지 검증
        verify(valueOperations).set(eq("email:code:test@test.com"), anyString(), eq(3L),
                eq(TimeUnit.MINUTES));
        // → anyString() 쓰는 이유: 인증코드는 Random이라 어떤 값인지 모름
        verify(mailSender).send(any(SimpleMailMessage.class));
        // 2. mailSender.send()가 1번 호출됐는지 검증

    }

    // ==================== verifyCode() 테스트 ====================

    @Test
    @DisplayName("이메일 인증 코드 확인 성공")
    void verifyCode_성공() {
        // given

        // Redis에 "test@test.com" 키로 "123456" 코드가 저장돼 있는 상황을 만들기
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        // 힌트: given(redisTemplate.opsForValue()).willReturn(valueOperations)
        given(valueOperations.get("email:code:test@test.com")).willReturn("123456");

        // when
        // authService.verifyCode("test@test.com", "123456") 호출
        // 예외 없이 정상 실행되면 성공
        authService.verifyCode("test@test.com", "123456");

        // then
        // Redis 키가 삭제됐는지 검증
        verify(redisTemplate).delete("email:code:test@test.com");
    }

    @Test
    @DisplayName("이메일 인증 실패 - 코드 만료 (Redis에 키 없음)")
    void verifyCode_만료_예외() {
        // given
        // Redis에 키가 없는 상황 → get()이 null 반환
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        // 힌트: given(redisTemplate.opsForValue()).willReturn(valueOperations)
        // given(valueOperations.get("test@test.com")).willReturn(null)
        given(valueOperations.get("email:code:test@test.com")).willReturn(null);

        // when & then
        // EMAIL_CODE_EXPIRED 예외가 발생해야 함
        assertThatThrownBy(() -> authService.verifyCode("test@test.com", "1234"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_CODE_EXPIRED);
    }

    @Test
    @DisplayName("이메일 인증 실패 - 코드 불일치")
    void verifyCode_불일치_예외() {
        // given
        // Redis에 "123456"이 저장돼 있는데 "999999"를 입력하는 상황
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("email:code:test@test.com")).willReturn("123456");

        // delete()는 절대 호출되면 안 됨 (인증 실패했으니 키 삭제하면 안 됨)
        // 힌트: verify(redisTemplate, never()).delete(anyString())
        assertThatThrownBy(() -> authService.verifyCode("test@test.com", "999999"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_CODE_INVALID);

        verify(redisTemplate, never()).delete(anyString());
    }

    // ==================== login() 테스트 ====================

    @Test
    @DisplayName("로그인 성공")
    void login_성공() {
        // given
        // 1. DB에 유저가 존재하는 상황
        // 힌트: User 객체는 User.from(signupRequest, "encodedPassword") 로 만들 수 있음
        User user = User.from(signupRequest, "encodedPassword");
        // 힌트:
        // given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user))
        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

        // 2. 비밀번호가 일치하는 상황
        // 힌트: given(passwordEncoder.matches("password123",
        // "encodedPassword")).willReturn(true)
        given(passwordEncoder.matches("password123", "encodedPassword")).willReturn(true);

        // 3. JWT 토큰 생성
        // 힌트: given(jwtProvider.generateAccessToken(any(),
        // any())).willReturn("jwt-token")
        given(jwtProvider.generateAccessToken(any(), any(), any())).willReturn("token");

        // when
        // authService.login(loginRequest) 호출
        LoginRequest loginRequest = new LoginRequest("test@test.com", "password123");
        LoginResponse response = authService.login(loginRequest);

        // then
        // 1. 반환된 accessToken 이 "jwt-token" 인지 확인
        // 힌트: assertThat(response.getAccessToken()).isEqualTo("jwt-token")
        assertThat(response.accessToken()).isEqualTo("token");
    }

    @Test
    @DisplayName("로그인 실패 - 존재하지 않는 계정")
    void login_없는계정_예외() {
        LoginRequest loginRequest = new LoginRequest("test@test.com", "password123");

        // given
        // DB에 유저가 없는 상황
        // 힌트: given(userRepository.findByEmail(any())).willReturn(Optional.empty())
        given(userRepository.findByEmail(any())).willReturn(Optional.empty());

        // when & then
        // ACCOUNT_NOT_FOUND 예외 발생해야 함
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCOUNT_NOT_FOUND);
    }

    @Test
    @DisplayName("로그인 실패 - 비밀번호 불일치")
    void login_비밀번호불일치_예외() {
        // given
        // 1. 유저는 DB에 존재
        // 2. 비밀번호가 틀린 상황
        // 힌트: given(passwordEncoder.matches("password123",
        // "encodedPassword")).willReturn(false)
        User user = User.from(signupRequest, "encodedPassword");
        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password123", "encodedPassword")).willReturn(false);

        // when & then
        // INVALID_PASSWORD 예외 발생해야 함
        LoginRequest loginRequest = new LoginRequest("test@test.com", "password123");

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PASSWORD);

        // jwtProvider.generateAccessToken()은 절대 호출되면 안 됨
        // 힌트: verify(jwtProvider, never()).generateAccessToken(any(), any())
        verify(jwtProvider, never()).generateAccessToken(eq(1L), eq("test@test.com"), any());
    }
}
