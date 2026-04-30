package ac.dankook.codeflow.global.prompt;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PromptFiller {
    public String fill(String template, Map<String, String> vars) {
        String result = template;

        for (Map.Entry<String, String> entry : vars.entrySet()) {
            String placeholder = "{" + entry.getKey() + "}";
            result = result.replace(placeholder, entry.getValue() == null ? "" : entry.getValue());
        }

        return result;
    }
}
