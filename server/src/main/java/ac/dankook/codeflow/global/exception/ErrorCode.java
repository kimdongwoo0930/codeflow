package ac.dankook.codeflow.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    DUPLICATE_USER_EMAIL("이미 가입된 이메일입니다.", HttpStatus.CONFLICT),
    ACCOUNT_NOT_FOUND("존재하지 않는 계정입니다.", HttpStatus.NOT_FOUND),
    INVALID_PASSWORD("비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),

    // Token
    INVALID_REFRESH_TOKEN("유효하지 않은 리프레시 토큰입니다.", HttpStatus.UNAUTHORIZED),

    EMAIL_CODE_EXPIRED("인증 코드가 만료됐습니다.", HttpStatus.BAD_REQUEST),
    EMAIL_CODE_INVALID("인증 코드가 올바르지 않습니다.", HttpStatus.BAD_REQUEST);

    private final String message;
    private final HttpStatus status;
}
