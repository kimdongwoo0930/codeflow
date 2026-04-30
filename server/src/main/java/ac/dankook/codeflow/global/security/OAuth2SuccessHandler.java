package ac.dankook.codeflow.global.security;

import java.io.IOException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final UserRepository userRepository;
        private final JwtProvider jwtProvider;

        // application.properties의 app.oauth2.redirect-uri 값
        // 로그인 성공 후 프론트엔드로 보낼 주소 (ex. http://localhost:3100/oauth/callback)
        @Value("${app.oauth2.redirect-uri}")
        private String redirectUri;

        /**
         * GitHub OAuth2 인증이 성공했을 때 Spring Security가 자동으로 호출하는 메서드
         *
         * authentication.getPrincipal() → GitHub에서 받아온 유저 정보 객체 (OAuth2User)
         * OAuth2User.getAttributes() → GitHub API 응답 JSON을 Map으로 담고 있음
         */
        @Override
        public void onAuthenticationSuccess(HttpServletRequest request,
                        HttpServletResponse response, Authentication authentication)
                        throws IOException {

                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

                String email = oAuth2User.getAttribute("email");
                String nickname = oAuth2User.getAttribute("login");
                String profileImage = oAuth2User.getAttribute("avatar_url");

                User user = userRepository.findByEmail(email).orElseGet(() -> userRepository
                                .save(User.fromGithub(email, nickname, profileImage)));

                String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(),
                                user.getRole().toString());

                getRedirectStrategy().sendRedirect(request, response,
                                redirectUri + "?token=" + accessToken);
        }
}
