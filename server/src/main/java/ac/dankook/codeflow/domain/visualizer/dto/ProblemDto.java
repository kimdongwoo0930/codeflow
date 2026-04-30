package ac.dankook.codeflow.domain.visualizer.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProblemDto {

    private String title;
    private String description;
    private String difficulty;
}
