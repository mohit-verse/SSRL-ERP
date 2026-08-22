import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import BillDetailClient from './BillDetailClient';

interface Props {
  params: {
    id: string;
  };
}

export default async function BillDetailPage({ params }: Props) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <BillDetailClient billId={params.id} userRole={profile.role} />
    </div>
  );
}
