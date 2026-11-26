import React, { useRef, useState } from 'react';
import { Mail, Lock, Check, AlertCircle } from 'lucide-react';
import { DEMO_CREDENTIALS, saveDemoSession } from './authConfig';

interface LoginCardProps {
  isLit: boolean;
  onSuccess: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ isLit, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [shakeCount, setShakeCount] = useState(0);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const triggerShake = () => {
    setShakeCount((prev) => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLit) return;

    setInfoMsg(null);
    const rawEmail = emailRef.current?.value ?? email;
    const rawPassword = passwordRef.current?.value ?? password;
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const normalizedPassword = rawPassword.trim().replace(/\s+/g, ' ');

    if (
      normalizedEmail === DEMO_CREDENTIALS.email.toLowerCase() &&
      normalizedPassword === DEMO_CREDENTIALS.password
    ) {
      setErrorMsg(null);
      saveDemoSession(keepSignedIn);
      onSuccess();
      return;
    }

    setErrorMsg('Invalid email or password. Please check your credentials.');
    triggerShake();
  };

  return (
    <div
      aria-hidden={!isLit}
      className={`w-full max-w-[390px] transition-all duration-500 ease-out ${
        isLit
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-3 scale-[0.98] pointer-events-none'
      }`}
    >
      <div
        key={shakeCount}
        className={`relative rounded-[24px] p-6 sm:p-7 border backdrop-blur-2xl ${
          shakeCount > 0 ? 'lamp-card-shake' : ''
        }`}
        style={{
          backgroundColor: 'var(--login-card-bg)',
          borderColor: isLit ? 'var(--login-card-border-lit)' : 'var(--login-card-border)',
          boxShadow: 'var(--login-card-shadow)'
        }}
      >
        {/* Subtle warm left-edge rim from lamp */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 left-0 w-px"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(255, 200, 125, 0.36) 45%, transparent 100%)'
          }}
        />

        {/* Header */}
        <div className="mb-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'var(--login-eyebrow)' }}
          >
            STUDIO ACCESS
          </p>
          <h1
            className="text-[26px] sm:text-[28px] font-semibold tracking-tight leading-[1.15]"
            style={{ color: 'var(--login-title)' }}
          >
            Welcome back.
          </h1>
          <p
            className="font-serif italic text-[24px] sm:text-[26px] leading-[1.2] mt-0.5"
            style={{ color: 'var(--login-subtitle)' }}
          >
            Pull up a chair.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="lamp-login-email"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--login-label)' }}
            >
              EMAIL
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--login-placeholder)' }}
              />
              <input
                ref={emailRef}
                id="lamp-login-email"
                type="email"
                autoComplete="email"
                value={email}
                tabIndex={isLit ? 0 : -1}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="you@studio.com"
                className="lamp-login-input w-full h-11 pl-10 pr-3.5 rounded-xl border text-[13.5px] focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--login-input-bg)',
                  borderColor: errorMsg ? 'rgba(248, 113, 113, 0.55)' : 'var(--login-input-border)',
                  color: 'var(--login-input-text)'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="lamp-login-password"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--login-label)' }}
            >
              PASSWORD
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--login-placeholder)' }}
              />
              <input
                ref={passwordRef}
                id="lamp-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                tabIndex={isLit ? 0 : -1}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••••••"
                className="lamp-login-input w-full h-11 pl-10 pr-14 rounded-xl border text-[13.5px] focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--login-input-bg)',
                  borderColor: errorMsg ? 'rgba(248, 113, 113, 0.55)' : 'var(--login-input-border)',
                  color: 'var(--login-input-text)'
                }}
              />
              <button
                type="button"
                tabIndex={isLit ? 0 : -1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] hover:opacity-85 transition-opacity"
                style={{ color: 'var(--login-label)' }}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* Keep me signed in & Forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={keepSignedIn}
                tabIndex={isLit ? 0 : -1}
                onClick={() => setKeepSignedIn((prev) => !prev)}
                className="w-4 h-4 rounded-[5px] flex items-center justify-center border transition-all"
                style={{
                  backgroundColor: keepSignedIn ? 'var(--login-checkbox-active)' : 'transparent',
                  borderColor: keepSignedIn ? 'var(--login-checkbox-active)' : 'rgba(255, 224, 184, 0.25)'
                }}
              >
                {keepSignedIn && <Check className="w-3 h-3 text-[#1B1109] stroke-[3]" />}
              </button>
              <span className="text-[12px]" style={{ color: 'var(--login-label)' }}>
                Keep me signed in
              </span>
            </label>

            <button
              type="button"
              tabIndex={isLit ? 0 : -1}
              onClick={() => {
                setErrorMsg(null);
                setInfoMsg('Demo mode — credentials are verified locally in your browser.');
              }}
              className="text-[12px] hover:underline transition-opacity hover:opacity-90"
              style={{ color: 'var(--login-label)' }}
            >
              Forgot password
            </button>
          </div>

          {/* Inline Error or Info */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium border"
              style={{
                backgroundColor: 'rgba(248, 113, 113, 0.10)',
                borderColor: 'rgba(248, 113, 113, 0.35)',
                color: 'var(--login-error)'
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && !errorMsg && (
            <p className="text-[11.5px] px-1" style={{ color: 'var(--login-eyebrow)' }}>
              {infoMsg}
            </p>
          )}

          {/* Gold Gradient Sign In Button */}
          <button
            type="submit"
            tabIndex={isLit ? 0 : -1}
            className="w-full h-11 rounded-xl text-[13.5px] font-bold tracking-tight transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
            style={{
              background: 'var(--login-btn-grad)',
              color: 'var(--login-btn-text)',
              boxShadow: 'var(--login-btn-shadow)'
            }}
          >
            Sign in
          </button>
        </form>

        {/* OR Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255, 224, 184, 0.1)' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--login-muted)' }}
          >
            OR
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255, 224, 184, 0.1)' }} />
        </div>

        {/* Visual-Only OAuth Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            tabIndex={isLit ? 0 : -1}
            className="h-10 rounded-xl border flex items-center justify-center gap-2 text-[12.5px] font-medium transition-colors hover:bg-white/[0.06]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'var(--login-input-border)',
              color: 'var(--login-input-text)'
            }}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
            </svg>
            <span>Apple</span>
          </button>

          <button
            type="button"
            tabIndex={isLit ? 0 : -1}
            className="h-10 rounded-xl border flex items-center justify-center gap-2 text-[12.5px] font-medium transition-colors hover:bg-white/[0.06]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'var(--login-input-border)',
              color: 'var(--login-input-text)'
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.87 6.16-4.87z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.93 3.72-8.69z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-2.86 0-5.29-2.27-6.16-4.87H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Account Request & Footer Note */}
        <div className="mt-4 space-y-1.5 text-[11.5px]">
          <p style={{ color: 'var(--login-muted)' }}>
            No account?{' '}
            <span className="font-medium" style={{ color: 'var(--login-subtitle)' }}>
              Request one
            </span>
          </p>
          <p className="text-[11px]" style={{ color: 'var(--login-label)' }}>
            Developed by Bikash Talukder
          </p>
        </div>
      </div>
    </div>
  );
};
