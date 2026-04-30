package ac.dankook.codeflow.domain.problem.entity;

import java.util.List;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ac.dankook.codeflow.domain.problem.dto.ProblemResponseDto;
import ac.dankook.codeflow.global.entity.BaseTimeEntity;
import ac.dankook.codeflow.global.entity.StringListConverter;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class problem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String studyType;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String inputExample;

    @Column(columnDefinition = "TEXT")
    private String outputExample;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> constraints;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(columnDefinition = "TEXT")
    private String startCode;

    @Column(columnDefinition = "TEXT")
    private String answerCode;

    @Column(columnDefinition = "TEXT")
    private String expectedOutput;

    public static problem of(ProblemResponseDto dto, String studyType, String topic,
            String difficulty, Long userId) {
        problem p = new problem();
        p.userId = userId;
        p.studyType = studyType;
        p.topic = topic;
        p.difficulty = difficulty;
        p.title = dto.title();
        p.description = dto.description();
        p.inputExample = dto.inputExample();
        p.outputExample = dto.outputExample();
        p.constraints = dto.constraints();
        p.hint = dto.hint();
        p.startCode = dto.startCode();
        p.answerCode = dto.answerCode();
        p.expectedOutput = dto.expectedOutput();
        return p;
    }
}
