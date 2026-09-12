import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/auth/dal';
import { Navbar } from './components/navbar';
import { Sidebar } from './components/sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar user={user} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
