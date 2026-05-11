package ac.dankook.codeflow.domain.visualizer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TraceRequest {

    @NotBlank
    private String sourceCode;

    private String input;

    public String getSourceCode() {
        return sourceCode;
    }

    public String getInput() {
        return input;
    }
}
