import type { Metadata } from 'next';
import { LoginForm } from '../components/login-form';

export const metadata: Metadata = {
  title: 'Login - ReadEasy AI',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginForm oauthError={error} />;
}
