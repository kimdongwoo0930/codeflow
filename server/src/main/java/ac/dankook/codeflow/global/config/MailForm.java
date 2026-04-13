package ac.dankook.codeflow.global.config;

import org.springframework.mail.SimpleMailMessage;

public class MailForm {

    public static SimpleMailMessage verificationCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[Codeflow] 이메일 인증 코드");
        message.setText("인증 코드: " + code + "\n\n" + "3분 이내에 입력해주세요.");
        return message;
    }
}
