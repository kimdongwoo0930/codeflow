package ac.dankook.codeflow.domain.visualizer.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.ArrayReference;
import com.sun.jdi.BooleanValue;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.ByteValue;
import com.sun.jdi.CharValue;
import com.sun.jdi.DoubleValue;
import com.sun.jdi.FloatValue;
import com.sun.jdi.IntegerValue;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.Location;
import com.sun.jdi.LongValue;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ShortValue;
import com.sun.jdi.StackFrame;
import com.sun.jdi.StringReference;
import com.sun.jdi.VMDisconnectedException;
import com.sun.jdi.Value;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.VirtualMachineManager;
import com.sun.jdi.connect.AttachingConnector;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.event.ClassPrepareEvent;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventQueue;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.VMDeathEvent;
import com.sun.jdi.event.VMDisconnectEvent;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.StepRequest;

/**
 * JDI(Java Debug Interface)를 통해 Docker 컨테이너 안의 JVM에 원격 접속하여 코드 실행 흐름(라인별 변수 상태, 콜스택)을 추적하고 JSON으로
 * 반환한다.
 *
 * 동작 순서: 1. SocketAttach 커넥터로 JDWP 포트에 연결 2. Sample 클래스 로딩 이벤트(ClassPrepareEvent) 감지 후 StepRequest
 * 등록 3. StepEvent마다 현재 라인 / 지역 변수 / 콜스택 캡처 4. VMDeath or VMDisconnect 수신 시 종료 → JSON 직렬화 반환
 */
public class ExecutionTracker {

    private static final Logger log = LoggerFactory.getLogger(ExecutionTracker.class);

    private static final int MAX_STEPS = 1000;
    private static final int EVENT_TIMEOUT_MS = 10_000;

    private final String host;
    private final int port;
    private final String className;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExecutionTracker(String host, int port, String className) {
        this.host = host;
        this.port = port;
        this.className = className;
    }

    /**
     * 실행 추적을 시작하고 JSON 문자열을 반환한다.
     *
     * @return 스텝별 실행 정보가 담긴 JSON 배열 문자열
     */
    public String trace() throws Exception {
        VirtualMachine vm = connect();
        List<Map<String, Object>> steps = new ArrayList<>();

        try {
            EventRequestManager erm = vm.eventRequestManager();

            ClassPrepareRequest cpr = erm.createClassPrepareRequest();
            cpr.addClassFilter(className);
            cpr.enable();

            vm.resume();

            EventQueue queue = vm.eventQueue();
            int stepCount = 0;

            outer: while (stepCount < MAX_STEPS) {
                EventSet eventSet = queue.remove(EVENT_TIMEOUT_MS);
                if (eventSet == null) {
                    log.warn("이벤트 수신 타임아웃 ({}ms 초과)", EVENT_TIMEOUT_MS);
                    break;
                }

                for (Event event : eventSet) {
                    if (event instanceof ClassPrepareEvent cpe) {
                        StepRequest sr = erm.createStepRequest(cpe.thread(), StepRequest.STEP_LINE,
                                StepRequest.STEP_INTO);
                        sr.addClassFilter(className);
                        sr.enable();

                    } else if (event instanceof StepEvent se) {
                        stepCount++;
                        steps.add(captureStep(se, stepCount));

                    } else if (event instanceof VMDeathEvent
                            || event instanceof VMDisconnectEvent) {
                        break outer;
                    }
                }

                eventSet.resume();
            }

        } catch (VMDisconnectedException e) {
            log.info("VM 연결 종료 - 실행 완료");
        } finally {
            try {
                vm.dispose();
            } catch (Exception ignored) {
            }
        }

        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(steps);
    }

    private VirtualMachine connect() throws Exception {
        VirtualMachineManager vmm = Bootstrap.virtualMachineManager();

        AttachingConnector connector = vmm.attachingConnectors().stream()
                .filter(c -> c.name().equals("com.sun.jdi.SocketAttach")).findFirst()
                .orElseThrow(() -> new RuntimeException("SocketAttach 커넥터를 찾을 수 없습니다."));

        Map<String, Connector.Argument> args = connector.defaultArguments();
        args.get("hostname").setValue(host);
        args.get("port").setValue(String.valueOf(port));
        args.get("timeout").setValue("3000");

        long deadline = System.currentTimeMillis() + 15_000;
        Exception lastException = null;
        while (System.currentTimeMillis() < deadline) {
            try {
                log.info("JVM에 JDI 연결 중: {}:{}", host, port);
                return connector.attach(args);
            } catch (Exception e) {
                lastException = e;
                Thread.sleep(500);
            }
        }
        throw lastException;
    }

    private Map<String, Object> captureStep(StepEvent event, int stepNumber) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("step", stepNumber);

        Location location = event.location();
        step.put("line", location.lineNumber());
        step.put("method", location.method().name());
        step.put("class", location.declaringType().name());

        step.put("variables", captureVariables(event));
        step.put("stack", captureStack(event));

        return step;
    }

    private Map<String, Object> captureVariables(StepEvent event) {
        Map<String, Object> variables = new LinkedHashMap<>();
        try {
            StackFrame frame = event.thread().frame(0);
            for (LocalVariable var : frame.visibleVariables()) {
                variables.put(var.name(), serializeValue(frame.getValue(var)));
            }
        } catch (AbsentInformationException e) {
            variables.put("_note", "debug info unavailable (compile with -g)");
        } catch (Exception e) {
            variables.put("_error", e.getMessage());
        }
        return variables;
    }

    private List<String> captureStack(StepEvent event) {
        List<String> stack = new ArrayList<>();
        try {
            for (StackFrame frame : event.thread().frames()) {
                Location loc = frame.location();
                stack.add(loc.declaringType().name() + "." + loc.method().name() + ":"
                        + loc.lineNumber());
            }
        } catch (Exception e) {
            stack.add("_error: " + e.getMessage());
        }
        return stack;
    }

    private Object serializeValue(Value value) {
        if (value == null)
            return null;

        return switch (value) {
            case IntegerValue v -> v.value();
            case LongValue v -> v.value();
            case DoubleValue v -> v.value();
            case FloatValue v -> v.value();
            case BooleanValue v -> v.value();
            case CharValue v -> String.valueOf(v.value());
            case ByteValue v -> v.value();
            case ShortValue v -> v.value();
            case StringReference v -> v.value();
            case ArrayReference v -> {
                List<Object> list = new ArrayList<>();
                for (Value element : v.getValues()) {
                    list.add(serializeValue(element));
                }
                yield list;
            }
            case ObjectReference v -> value.type().name() + "@" + v.uniqueID();
            default -> value.toString();
        };
    }
}
