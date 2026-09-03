'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '@/app/lib/db';
import { NewUser, users } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/app/lib/auth/password';
import { createSession, clearSession } from '@/app/lib/auth/session';

const signupSchema = z.object({
  username: z
    .string()
    .min(2, { error: 'Username must be at least 2 characters long.' })
    .trim(),
  email: z.email({ error: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters.' })
    .regex(/[a-zA-Z]/, { error: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { error: 'Password must contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      error: 'Password must contain at least one special character.',
    })
    .trim(),
});

const loginSchema = z.object({
  email: z.email({ error: 'Please enter a valid email.' }),
  password: z.string().min(1, { error: 'Password is required.' }),
});

export type SignupState =
  | {
      message?: string;
      errors: {
        username?: string[];
        email?: string[];
        password?: string[];
      };
    }
  | undefined;

export type LoginState =
  | {
      message?: string;
      errors?: {
        email?: string[];
        password?: string[];
      };
    }
  | undefined;

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { username, email, password } = parsed.data;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return {
      errors: {
        email: ['An account with this email already exists.'],
      },
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    username,
    email,
    passwordHash,
  };

  const [user] = await db
    .insert(users)
    .values(newUser)
    .returning({ id: users.id });

  await createSession(user.id);

  redirect('/home');
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (
    !user ||
    !user.passwordHash ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    return { message: 'Incorrect email or password.' };
  }

  await createSession(user.id);

  redirect('/home');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
