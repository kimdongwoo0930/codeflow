'use client';

import { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://codeflow.dong02.com';
const TIMER_SECONDS = 3 * 60;

type Mode = 'login' | 'signup';
type VerifyStep = 'idle' | 'sent' | 'verified';

function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

interface AuthModalProps {
    initialMode?: Mode;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AuthModal({ initialMode = 'login', onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<Mode>(initialMode);

    // ESC 닫기 + 스크롤 잠금
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    function switchMode(next: Mode) {
        setMode(next);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl">
                {/* 탭 헤더 */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => switchMode('login')}
                        className={`flex-1 py-4 text-sm font-semibold transition rounded-tl-2xl ${
                            mode === 'login'
                                ? 'text-slate-50 border-b-2 border-blue -mb-px'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        로그인
                    </button>
                    <button
                        onClick={() => switchMode('signup')}
                        className={`flex-1 py-4 text-sm font-semibold transition rounded-tr-2xl ${
                            mode === 'signup'
                                ? 'text-slate-50 border-b-2 border-blue -mb-px'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        회원가입
                    </button>
                </div>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                    aria-label="닫기"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.749.749 0 1 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                </button>

                <div className="p-8">
                    {mode === 'login' ? (
                        <LoginForm
                            onSuccess={onSuccess}
                            onClose={onClose}
                            onSwitchToSignup={() => switchMode('signup')}
                        />
                    ) : (
                        <SignupForm
                            onSuccess={onSuccess}
                            onClose={onClose}
                            onSwitchToLogin={() => switchMode('login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── 로그인 폼 ───────────────────────────────────────────────
function LoginForm({
    onSuccess,
    onClose,
    onSwitchToSignup,
}: {
    onSuccess?: () => void;
    onClose: () => void;
    onSwitchToSignup: () => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('이메일과 비밀번호를 입력해 주세요.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(data?.message ?? '이메일 또는 비밀번호를 확인해 주세요.');
                return;
            }
            // 서버 응답에서 accessToken 꺼내서 저장
            const { data } = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            onSuccess?.();
            onClose();
        } catch {
            setError('서버에 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">이메일</label>
                <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">비밀번호</label>
                <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30"
                />
            </div>

            {error && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-blue to-purple py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? '로그인 중…' : '로그인'}
            </button>

            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-500">또는</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
                type="button"
                onClick={() => (window.location.href = `${API_BASE}/oauth2/authorization/github`)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
                <GitHubIcon />
                GitHub으로 로그인
            </button>
        </form>
    );
}

// ─── 회원가입 폼 ─────────────────────────────────────────────
function SignupForm({
    onSuccess,
    onClose,
    onSwitchToLogin,
}: {
    onSuccess?: () => void;
    onClose: () => void;
    onSwitchToLogin: () => void;
}) {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [verifyStep, setVerifyStep] = useState<VerifyStep>('idle');
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const [timerExpired, setTimerExpired] = useState(false);

    const [sendLoading, setSendLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [sendError, setSendError] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    function startTimer() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer(TIMER_SECONDS);
        setTimerExpired(false);
        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    setTimerExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    async function handleSendCode() {
        setSendError('');
        if (!email) {
            setSendError('이메일을 입력해 주세요.');
            return;
        }
        setSendLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/email/send?email=${encodeURIComponent(email)}`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setSendError(data?.message ?? '코드 발송에 실패했습니다.');
                return;
            }
            setVerifyStep('sent');
            startTimer();
        } catch {
            setSendError('서버에 연결할 수 없습니다.');
        } finally {
            setSendLoading(false);
        }
    }

    async function handleVerify() {
        setVerifyError('');
        if (!code) {
            setVerifyError('인증 코드를 입력해 주세요.');
            return;
        }
        if (timerExpired) {
            setVerifyError('인증 시간이 만료되었습니다. 코드를 다시 발송해 주세요.');
            return;
        }
        setVerifyLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/auth/email/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
                { method: 'POST' },
            );
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setVerifyError(data?.message ?? '인증 코드가 올바르지 않습니다.');
                return;
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
            setVerifyStep('verified');
        } catch {
            setVerifyError('서버에 연결할 수 없습니다.');
        } finally {
            setVerifyLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError('');
        if (verifyStep !== 'verified') {
            setSubmitError('이메일 인증을 완료해 주세요.');
            return;
        }
        if (!nickname || !password) {
            setSubmitError('닉네임과 비밀번호를 입력해 주세요.');
            return;
        }
        if (password !== passwordConfirm) {
            setSubmitError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setSubmitLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setSubmitError(data?.message ?? '회원가입에 실패했습니다.');
                return;
            }
            onSuccess?.();
            onClose();
        } catch {
            setSubmitError('서버에 연결할 수 없습니다.');
        } finally {
            setSubmitLoading(false);
        }
    }

    const emailLocked = verifyStep === 'sent' || verifyStep === 'verified';

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 이메일 + 코드 발송 */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">이메일</label>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={emailLocked}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={sendLoading || verifyStep === 'verified'}
                        className="shrink-0 rounded-lg bg-gradient-to-r from-blue to-purple px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {sendLoading
                            ? '발송 중…'
                            : verifyStep === 'sent'
                              ? '재발송'
                              : verifyStep === 'verified'
                                ? '인증완료'
                                : '코드 발송'}
                    </button>
                </div>
                {sendError && <p className="mt-1.5 text-xs text-red-400">{sendError}</p>}
            </div>

            {/* 인증 코드 */}
            {verifyStep !== 'idle' && (
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                        인증 코드
                        {verifyStep === 'sent' && (
                            <span
                                className={`ml-2 font-mono text-xs font-semibold ${timerExpired ? 'text-red-400' : timer <= 60 ? 'text-amber-400' : 'text-cyan'}`}
                            >
                                {timerExpired ? '만료됨' : formatTime(timer)}
                            </span>
                        )}
                        {verifyStep === 'verified' && (
                            <span className="ml-2 text-xs font-semibold text-emerald-400">✓ 인증완료</span>
                        )}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="6자리 코드 입력"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={verifyStep === 'verified'}
                            maxLength={10}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {verifyStep === 'sent' && (
                            <button
                                type="button"
                                onClick={handleVerify}
                                disabled={verifyLoading || timerExpired}
                                className="shrink-0 rounded-lg border border-blue/40 bg-blue/10 px-4 py-2.5 text-sm font-medium text-blue transition hover:bg-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {verifyLoading ? '확인 중…' : '인증 확인'}
                            </button>
                        )}
                    </div>
                    {verifyError && <p className="mt-1.5 text-xs text-red-400">{verifyError}</p>}
                </div>
            )}

            {/* 닉네임 */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">닉네임</label>
                <input
                    type="text"
                    placeholder="사용할 닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30"
                />
            </div>

            {/* 비밀번호 */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">비밀번호</label>
                <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue/60 focus:ring-1 focus:ring-blue/30"
                />
            </div>

            {/* 비밀번호 확인 */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">비밀번호 확인</label>
                <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:ring-1 ${
                        passwordConfirm && password !== passwordConfirm
                            ? 'border-red-400/50 focus:border-red-400/60 focus:ring-red-400/20'
                            : passwordConfirm && password === passwordConfirm
                              ? 'border-emerald-400/50 focus:border-emerald-400/60 focus:ring-emerald-400/20'
                              : 'border-white/10 focus:border-blue/60 focus:ring-blue/30'
                    }`}
                />
                {passwordConfirm && password !== passwordConfirm && (
                    <p className="mt-1.5 text-xs text-red-400">비밀번호가 일치하지 않습니다.</p>
                )}
                {passwordConfirm && password === passwordConfirm && (
                    <p className="mt-1.5 text-xs text-emerald-400">비밀번호가 일치합니다.</p>
                )}
            </div>

            {submitError && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-400">
                    {submitError}
                </p>
            )}

            <button
                type="submit"
                disabled={submitLoading || verifyStep !== 'verified'}
                className="w-full rounded-lg bg-gradient-to-r from-blue to-purple py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {submitLoading ? '가입 중…' : '회원가입'}
            </button>
        </form>
    );
}
