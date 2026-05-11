package ac.dankook.codeflow.domain.problem.service;

import ac.dankook.codeflow.domain.problem.entity.problem;
import ac.dankook.codeflow.global.prompt.PromptFiller;
import ac.dankook.codeflow.global.prompt.PromptTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import static java.util.Map.entry;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    private final GeminiService geminiService;
    private final PromptFiller promptFiller;

    public String generateFeedback(problem p, String usersCode, String difficulty,
            String actualOutput, String expectedOutput) {
        String prompt = promptFiller.fill(PromptTemplate.FEEDBACK, Map.ofEntries(
                entry("title",                 p.getTitle()),
                entry("difficulty",            defaultValue(difficulty, "보통")),
                entry("description",           p.getDescription()),
                entry("inputExample",          defaultValue(p.getInputExample(), "없음")),
                entry("outputExample",         defaultValue(p.getOutputExample(), "없음")),
                entry("constraints",           constraintsToString(p.getConstraints())),
                entry("actualOutput",          defaultValue(actualOutput, "없음")),
                entry("expectedOutput",        defaultValue(expectedOutput, "없음")),
                entry("answerCode",            defaultValue(p.getAnswerCode(), "제공되지 않음")),
                entry("userCode",              defaultValue(usersCode, "코드 없음")),
                entry("difficultyInstruction", getDifficultyInstruction(difficulty))
        ));
        return geminiService.callGeminiFeedback(prompt);
    }

    private String getDifficultyInstruction(String difficulty) {
        if (difficulty == null) return getDefaultInstruction();
        return switch (difficulty) {
            case "입문" -> """
                    - 학생이 처음 배우는 단계임을 고려하여 매우 친절하고 쉬운 언어로 설명하세요.
                    - 어떤 줄이 왜 틀렸는지 구체적으로 짚어 주세요.
                    - 수정된 코드 스니펫을 직접 제시하여 바로 적용할 수 있게 도와주세요.
                    - 정답을 알려주되, 왜 그게 정답인지 이유도 함께 설명하세요.""";
            case "초급" -> """
                    - 틀린 부분의 원인을 논리적으로 설명하되, 수정 코드는 직접 주지 마세요.
                    - 어떤 개념을 다시 확인하면 좋을지 힌트를 제공하세요.
                    - 학생 스스로 고쳐볼 수 있도록 방향만 제시하세요.""";
            case "중급" -> """
                    - 코드의 논리 흐름 전체를 검토하고 문제점을 분석하세요.
                    - 어떤 케이스를 놓쳤는지, 또는 알고리즘 설계가 왜 잘못됐는지 설명하세요.
                    - 구체적인 수정 방법 대신 스스로 개선할 수 있는 질문을 던져 주세요.
                    - 코드 가독성이나 구조적 개선점도 간략히 언급하세요.""";
            case "고급" -> """
                    - 단순한 오답 지적을 넘어 코드 품질 전반을 리뷰하세요.
                    - 예외 처리, 엣지 케이스, 시간/공간 복잡도 관점에서 문제점을 분석하세요.
                    - 더 나은 설계 패턴이나 자바 관용구가 있다면 제안하세요.
                    - 힌트 수준을 최소화하여 학생이 깊이 고민하도록 유도하세요.""";
            default -> getDefaultInstruction();
        };
    }

    private String getDefaultInstruction() {
        return """
                - 틀린 부분을 설명하고 개선 방향을 제시하세요.
                - 학생이 스스로 수정할 수 있도록 힌트를 제공하세요.""";
    }

    private String constraintsToString(List<String> constraints) {
        if (constraints == null || constraints.isEmpty()) return "없음";
        return String.join("\n- ", constraints);
    }

    private String defaultValue(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
