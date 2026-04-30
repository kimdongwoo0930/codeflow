package ac.dankook.codeflow.domain.user.dto;

import ac.dankook.codeflow.domain.user.dto.type.LoginType;
import ac.dankook.codeflow.domain.user.entity.User;

public record UserResponse(Long id, String email, String nickname, String profileImage,
        LoginType loginType) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname(),
                user.getProfileImage(), user.getLoginType());
    }
}
