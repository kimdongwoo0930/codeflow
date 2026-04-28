package ac.dankook.codeflow.domain.visualizer.test;

import java.util.Scanner;

/**
 * 시각화 대상 샘플 코드. DockerTracker가 이 파일을 읽어 Docker 컨테이너 안에서 실행한다. Docker 전송 시 package 선언은 자동으로 제거된다.
 */
public class Sample {
    public static void main(String[] args) {
        try (Scanner sc = new Scanner(System.in)) {
            int n = sc.nextInt();
            int[] arr = new int[n];

            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }

            int max = arr[0];
            for (int i = 1; i < n; i++) {
                if (arr[i] > max) {
                    max = arr[i];
                }
            }

            System.out.println(max);
        }
    }
}
