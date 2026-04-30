package ac.dankook.codeflow.domain.problem.dto;

import java.util.List;

public record ProblemResponseDto(String title, String description, String inputExample,
                String outputExample, List<String> constraints, String hint, String startCode,
                String answerCode, String expectedOutput) {
}
