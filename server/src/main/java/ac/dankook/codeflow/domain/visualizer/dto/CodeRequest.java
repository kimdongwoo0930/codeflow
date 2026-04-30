package ac.dankook.codeflow.domain.visualizer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CodeRequest {

    private String language;

    @NotBlank
    private String code;

    private ProblemDto problem;

    private List<TestCaseDto> testCases;

    private int attemptCount;
}
