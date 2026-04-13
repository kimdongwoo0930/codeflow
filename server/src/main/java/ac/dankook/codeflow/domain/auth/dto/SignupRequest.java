package ac.dankook.codeflow.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequest {

    // 사용자 이메일 (형식 검증 필요)
    @Email
    private String email;

    // 비밀번호 (최소 길이 등 검증 필요)
    private String password;

    // 닉네임
    @NotBlank
    private String nickname;

}
