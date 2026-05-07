package ac.dankook.codeflow.domain.problem.service;

import ac.dankook.codeflow.domain.problem.entity.problem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    private final GeminiService geminiService;

    public String generateFeedback(problem p, String usersCode, String difficulty) {
        String prompt = buildFeedbackPrompt(p, usersCode, difficulty);

        return geminiService.callGeminiFeedback(prompt);
    }

    private String buildFeedbackPrompt(problem p, String usersCode, String difficulty) {
        String difficultyInstruction = getDifficultyInstruction(difficulty);

        return """
                당신은 친절하고 전문적인 코딩 교육 튜터입니다.
                아래 정보를 바탕으로 학생의 오답 코드에 대해 한국어로 피드백을 작성하세요.

                ## 문제 정보
                - 제목: %s
                - 난이도: %s
                - 문제 설명:
                %s

                - 입력 예시:
                %s

                - 출력 예시:
                %s

                - 제약 조건:
                %s

                - 정답 코드 (참고용):
                ```java
                %s
                ```

                ## 학생이 제출한 코드
                ```java
                %s
                ```

                ## 피드백 작성 지침
                %s

                ## 출력 형식
                - 마크다운을 사용하지 말고 평문으로 작성하세요.
                - 학생이 틀린 이유, 개선 방향 순서로 작성하세요.
                - 전체 길이는 300자 이내로 간결하게 작성하세요.
                """.formatted(
                        p.getTitle(),
                        difficulty,
                        p.getDescription(),
                        defaultValue(p.getInputExample(), "없음"),
                        defaultValue(p.getOutputExample(), "없음"),
                        constraintsToString(p.getConstraints()),
                        defaultValue(p.getAnswerCode(), "제공되지 않음"),
                        defaultValue(usersCode, "코드 없음"),
                        difficultyInstruction
                );
    }

    private String getDifficultyInstruction(String difficulty) {
        if (difficulty == null) return getDefaultInstruction();
        return switch (difficulty) {
            case "입문" -> """
                    - 학생이 처음 배우는 단계임을 고려하여 매우 친절하고 쉬운 언어로 설명하세요.
                    - 어떤 줄이 왜 틀렸는지 구체적으로 짚어 주세요.
                    - 수정된 코드 스니펫을 직접 제시하여 바로 적용할 수 있게 도와주세요.
                    - 정답을 알려주되, 왜 그게 정답인지 이유도 함께 설명하세요.
                    """;
            case "초급" -> """
                    - 틀린 부분의 원인을 논리적으로 설명하되, 수정 코드는 직접 주지 마세요.
                    - 어떤 개념을 다시 확인하면 좋을지 힌트를 제공하세요.
                    - 학생 스스로 고쳐볼 수 있도록 방향만 제시하세요.
                    """;
            case "중급" -> """
                    - 코드의 논리 흐름 전체를 검토하고 문제점을 분석하세요.
                    - 어떤 케이스를 놓쳤는지, 또는 알고리즘 설계가 왜 잘못됐는지 설명하세요.
                    - 구체적인 수정 방법 대신 스스로 개선할 수 있는 질문을 던져 주세요.
                    - 코드 가독성이나 구조적 개선점도 간략히 언급하세요.
                    """;
            case "고급" -> """
                    - 단순한 오답 지적을 넘어 코드 품질 전반을 리뷰하세요.
                    - 예외 처리, 엣지 케이스, 시간/공간 복잡도 관점에서 문제점을 분석하세요.
                    - 더 나은 설계 패턴이나 자바 관용구가 있다면 제안하세요.
                    - 힌트 수준을 최소화하여 학생이 깊이 고민하도록 유도하세요.
                    """;
            default -> getDefaultInstruction();
        };
    }

    private String getDefaultInstruction() {
        return """
                - 틀린 부분을 설명하고 개선 방향을 제시하세요.
                - 학생이 스스로 수정할 수 있도록 힌트를 제공하세요.
                """;
    }

    private String constraintsToString(java.util.List<String> constraints) {
        if (constraints == null || constraints.isEmpty()) return "없음";
        return String.join("\n- ", constraints);
    }

    private String defaultValue(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}