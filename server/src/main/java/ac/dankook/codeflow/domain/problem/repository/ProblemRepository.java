package ac.dankook.codeflow.domain.problem.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ac.dankook.codeflow.domain.problem.entity.problem;

public interface ProblemRepository extends JpaRepository<problem, Long> {
    List<problem> findByUserIdOrderByCreatedAtDesc(Long userId);
}
