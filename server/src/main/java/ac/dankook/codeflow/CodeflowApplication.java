package ac.dankook.codeflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class CodeflowApplication {

	public static void main(String[] args) {
		SpringApplication.run(CodeflowApplication.class, args);
	}

}
