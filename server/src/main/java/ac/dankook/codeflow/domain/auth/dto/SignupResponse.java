package ac.dankook.codeflow.domain.auth.dto;

import ac.dankook.codeflow.domain.user.entity.User;

public record SignupResponse(
        String email,
        String nickname
) {
    public static SignupResponse of(User user) {
        return new SignupResponse(user.getEmail(), user.getNickname());
    }
}
