package ac.dankook.codeflow.global.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    DUPLICATE_USER_EMAIL("이미 가입된 이메일입니다.", HttpStatus.CONFLICT), 
    ACCOUNT_NOT_FOUND("존재하지 않는 계정입니다.",HttpStatus.NOT_FOUND), 
    INVALID_PASSWORD("비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),

    EMAIL_CODE_EXPIRED("인증 코드가 만료됐습니다.", HttpStatus.BAD_REQUEST),
    EMAIL_CODE_INVALID("인증 코드가 올바르지 않습니다.", HttpStatus.BAD_REQUEST),

    // Problem
    AI_RESPONSE_FAILURE("AI 응답 파싱에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    STAGE_PROBLEM_NOT_FOUND("단계별 문제를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);

    private final String message;
    private final HttpStatus status;
}
