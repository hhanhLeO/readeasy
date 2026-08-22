'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { LoginState, login } from '../action';
import { SubmitButton } from './submit-button';
import { Eye, EyeOff } from 'lucide-react';

const initialState: LoginState = undefined;

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <h1 className="mb-2 font-serif text-[32px] font-bold tracking-[-0.01em]">
        Welcome back
      </h1>
      <p className="mb-8 text-text-secondary">Continue where you left off.</p>

      <form action={formAction} className="flex flex-col gap-3.5">
        {state?.message && (
          <p className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {state.message}
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            Email address
          </label>
          <input
            type="email"
            name="email"
            required
            className="input"
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p className="error-text">{state.errors.email[0]}</p>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[13px] font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-accent">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              className="input"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-text-tertiary cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={2} />
              ) : (
                <Eye size={16} strokeWidth={2} />
              )}
            </button>
          </div>
          {state?.errors?.password && (
            <p className="error-text">{state.errors.password[0]}</p>
          )}
        </div>
        <SubmitButton label="Log in" pendingLabel="Logging in…" />
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-tertiary">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button type="button" className="btn-secondary btn-md w-full">
        {/* Google Icon */}
        <svg
          width="16px"
          height="16px"
          viewBox="-3 0 262 262"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
          fill="#000000"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              fill="#4285F4"
            ></path>
            <path
              d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              fill="#34A853"
            ></path>
            <path
              d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
              fill="#FBBC05"
            ></path>
            <path
              d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              fill="#EB4335"
            ></path>
          </g>
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
}
