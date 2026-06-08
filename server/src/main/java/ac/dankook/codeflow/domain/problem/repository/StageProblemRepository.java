package ac.dankook.codeflow.domain.problem.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ac.dankook.codeflow.domain.problem.entity.StageProblem;

public interface StageProblemRepository extends JpaRepository<StageProblem, Long> {
    List<StageProblem> findAllByOrderByOrderIndexAsc();
    boolean existsByTopic(String topic);
}
