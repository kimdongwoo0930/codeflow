package ac.dankook.codeflow.domain.problem.entity;

import java.util.List;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ac.dankook.codeflow.global.entity.BaseTimeEntity;
import ac.dankook.codeflow.global.entity.StringListConverter;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stage_problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StageProblem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> constraints;

    @Column(columnDefinition = "TEXT")
    private String inputExample;

    @Column(columnDefinition = "TEXT")
    private String outputExample;

    @Column(columnDefinition = "TEXT")
    private String starterCode;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private int orderIndex;

    public static StageProblem of(String topic, String title, String description,
            List<String> constraints, String inputExample, String outputExample,
            String starterCode, String difficulty, int orderIndex) {
        StageProblem p = new StageProblem();
        p.topic = topic;
        p.title = title;
        p.description = description;
        p.constraints = constraints;
        p.inputExample = inputExample;
        p.outputExample = outputExample;
        p.starterCode = starterCode;
        p.difficulty = difficulty;
        p.orderIndex = orderIndex;
        return p;
    }
}
