package ac.dankook.codeflow.global.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import ac.dankook.codeflow.domain.problem.entity.StageProblem;
import ac.dankook.codeflow.domain.problem.repository.StageProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class StageDataSeeder implements ApplicationRunner {

    private final StageProblemRepository stageProblemRepository;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> TOPIC_DIFFICULTY = Map.of(
            "출력문", "입문",
            "연산", "입문",
            "반복문", "쉬움",
            "조건문", "쉬움",
            "문자열", "보통",
            "리스트", "보통",
            "2차원 리스트", "보통"
    );

    private static final Map<String, String> TOPIC_DESCRIPTION = Map.of(
            "출력문", "System.out.println으로 원하는 결과를 정확히 출력합니다.",
            "연산", "산술 연산자와 나머지 연산으로 값을 계산합니다.",
            "반복문", "for와 while로 같은 작업을 여러 번 처리합니다.",
            "조건문", "if / else if / else로 상황에 따라 다른 코드를 실행합니다.",
            "문자열", "String 메서드로 텍스트의 길이와 형태를 다룹니다.",
            "리스트", "여러 값을 순서대로 저장하고 인덱스로 접근합니다.",
            "2차원 리스트", "행과 열로 구성된 값을 순회하며 처리합니다."
    );

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (stageProblemRepository.count() > 0) {
            log.info("단계별 문제 이미 세팅됨, 스킵");
            return;
        }

        ClassPathResource resource = new ClassPathResource("problems.json");
        List<RawProblem> rawProblems = objectMapper.readValue(
                resource.getInputStream(), new TypeReference<>() {});

        List<StageProblem> problems = new java.util.ArrayList<>();
        for (int i = 0; i < rawProblems.size(); i++) {
            RawProblem raw = rawProblems.get(i);
            String difficulty = TOPIC_DIFFICULTY.getOrDefault(raw.topic(), "보통");
            String indented = indentJavaCode(raw.starterCode());
            problems.add(StageProblem.of(
                    raw.topic(), raw.title(), raw.description(),
                    raw.constraints(), raw.inputExample(), raw.outputExample(),
                    indented, difficulty, i));
        }

        stageProblemRepository.saveAll(problems);
        log.info("단계별 문제 {}개 시딩 완료", problems.size());
    }

    private String indentJavaCode(String code) {
        if (code == null) return "";
        String indent = "  ";
        int depth = 0;
        StringBuilder sb = new StringBuilder();

        for (String rawLine : code.split("\n")) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                sb.append("\n");
                continue;
            }
            int leadingCloses = 0;
            for (char c : line.toCharArray()) {
                if (c == '}') leadingCloses++;
                else break;
            }
            int displayDepth = Math.max(0, depth - leadingCloses);
            sb.append(indent.repeat(displayDepth)).append(line).append("\n");

            long opens = line.chars().filter(c -> c == '{').count();
            long closes = line.chars().filter(c -> c == '}').count();
            depth = Math.max(0, (int) (depth + opens - closes));
        }
        return sb.toString().stripTrailing();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawProblem(
            String topic,
            String title,
            String description,
            List<String> constraints,
            @JsonProperty("input_example") String inputExample,
            @JsonProperty("output_example") String outputExample,
            @JsonProperty("starter_code") String starterCode
    ) {}

    public static Map<String, String> getTopicDescription() {
        return TOPIC_DESCRIPTION;
    }
}
