'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '../../components/auth/AuthShell';
import { useAuth } from '../../components/auth/AuthProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ApiRequestError } from '../../lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      router.push('/boards');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Boards, columns, and tasks — free to set up."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-ink-tertiary">Use at least 8 characters.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
