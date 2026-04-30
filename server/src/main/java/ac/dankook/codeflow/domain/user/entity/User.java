package ac.dankook.codeflow.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ac.dankook.codeflow.domain.auth.dto.SignupRequest;
import ac.dankook.codeflow.domain.user.dto.type.LoginType;
import ac.dankook.codeflow.domain.user.dto.type.Role;
import ac.dankook.codeflow.global.entity.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password; // GitHub OAuth면 null

    @Column(nullable = false)
    private String nickname;

    @Column
    private String profileImage; // null이면 프론트에서 기본 이미지

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginType loginType; // EMAIL, GITHUB

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ROLE_USER, ROLE_ADMIN

    @Column(nullable = false)
    private boolean emailVerified;

    public static User from(SignupRequest request, String encodedPassword) {
        return new User(null, request.email(), encodedPassword, request.nickname(), null,
                LoginType.EMAIL, Role.ROLE_USER, true);
    }

    public static User fromGithub(String email, String nickname, String profileImage) {
        return new User(null, email, null, nickname, profileImage, LoginType.GITHUB, Role.ROLE_USER,
                true);
    }

}
