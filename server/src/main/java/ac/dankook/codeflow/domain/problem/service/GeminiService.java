package ac.dankook.codeflow.domain.problem.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.dto.GeminiResponse;
import ac.dankook.codeflow.domain.problem.dto.ProblemResponseDto;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import ac.dankook.codeflow.global.prompt.PromptFiller;
import ac.dankook.codeflow.global.prompt.PromptTemplate;

@Service
public class GeminiService {
    private final RestClient restClient;
    private final PromptFiller promptFiller;
    private final ObjectMapper objectMapper;

    @Value("${GOOGLE_GEMINI_API_KEY}")
    private String apiKey;

    public GeminiService(RestClient.Builder restClientBuilder, PromptFiller promptFiller,
            ObjectMapper objectMapper) {
        this.restClient = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
        this.promptFiller = promptFiller;
        this.objectMapper = objectMapper;
    }

    // 문제 생성 부분
    public ProblemResponseDto generateProblem(String studyType, String topic, String difficulty,
            String detail) {
        String prompt = promptFiller.fill(PromptTemplate.PROBLEM_GENERATE,
                Map.of("studyType", defaultString(studyType), "topic", defaultString(topic),
                        "difficulty", defaultString(difficulty), "difficultyDescription",
                        getDifficultyDescription(difficulty), "detail",
                        defaultString(detail).isBlank() ? "없음" : defaultString(detail)));
        String response = callGemini(prompt);

        try {
            return objectMapper.readValue(response, ProblemResponseDto.class);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }
    }

    // AI 튜터 부분
    public String askTutor(String topic, String difficulty, String problem, String userCode,
            String question) {
        String prompt = promptFiller.fill(PromptTemplate.AI_TUTOR, Map.of("topic",
                defaultString(topic), "difficulty", defaultString(difficulty), "problem",
                defaultString(problem), "userCode",
                defaultString(userCode).isBlank() ? "아직 코드를 작성하지 않았습니다." : defaultString(userCode),
                "question", defaultString(question)));
        return callGemini(prompt);
    }

    // 피드백 생성
    public String callGeminiFeedback(String prompt) {
        return callGemini(prompt);
    }

    // 제미나이 호출 부분
    private String callGemini(String prompt) {
        Map<String, Object> requestBody =
                Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));

        GeminiResponse response = restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/gemini-flash-latest:generateContent")
                        .queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON).body(requestBody).retrieve()
                .body(GeminiResponse.class);

        if (response == null || response.candidates() == null || response.candidates().isEmpty()
                || response.candidates().get(0).content() == null
                || response.candidates().get(0).content().parts() == null
                || response.candidates().get(0).content().parts().isEmpty()
                || response.candidates().get(0).content().parts().get(0).text() == null) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_FAILURE);
        }

        return stripJsonMarkdown(response.candidates().get(0).content().parts().get(0).text());
    }

    private String stripJsonMarkdown(String responseText) {
        String trimmed = responseText.trim();

        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7).trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3).trim();
        }

        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }

        return trimmed;
    }

    private String getDifficultyDescription(String difficulty) {
        if (difficulty == null)
            return "";
        return switch (difficulty) {
            case "입문" -> "개념 하나를 그대로 사용하는 수준. 설명대로 따라 작성하면 풀리는 문제";
            case "쉬움" -> "기본 개념을 살짝 응용하는 수준. 주어진 구조 안에서 조건 한두 개 추가";
            case "보통" -> "여러 조건이 합쳐진 수준. 학생이 흐름을 직접 설계해야 하는 문제";
            case "어려움" -> "예외 케이스까지 고려해야 하는 수준. 깊은 이해와 응용이 필요한 문제";
            default -> "";
        };
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }
}
