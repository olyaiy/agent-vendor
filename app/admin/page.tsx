import { redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';

export default async function AdminPage() {
  const session = await auth();
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!session?.user?.id || session.user.id !== adminUserId) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome, Admin User!</p>
      {/* Add admin-specific content here */}
    </div>
  );
}
