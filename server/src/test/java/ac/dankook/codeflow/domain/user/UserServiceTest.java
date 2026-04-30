package ac.dankook.codeflow.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.user.dto.UserResponse;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.UserRepository;
import ac.dankook.codeflow.domain.user.service.UserService;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    // ==================== getMe() 테스트 ====================

    @Test
    @DisplayName("내 정보 조회 성공")
    void getMe_성공() {
        // given
        SignupRequest signupRequest = new SignupRequest("test@test.com", "password123", "tester");
        User user = User.from(signupRequest, "encodedPassword");
        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        // when
        UserResponse response = userService.getMe(1L);

        // then
        assertThat(response.email()).isEqualTo("test@test.com");
        assertThat(response.nickname()).isEqualTo("tester");
    }

    @Test
    @DisplayName("내 정보 조회 실패 - 존재하지 않는 ID")
    void getMe_없는유저_예외() {
        // given
        given(userRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.getMe(999L)).isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCOUNT_NOT_FOUND);
    }
}
