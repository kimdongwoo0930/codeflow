package ac.dankook.codeflow.domain.auth.dto;

import ac.dankook.codeflow.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SignupResponse {

    private String email;
    private String nickname;

    public static SignupResponse of(User user) {
        return new SignupResponse(user.getEmail(), user.getNickname());
    }
}
