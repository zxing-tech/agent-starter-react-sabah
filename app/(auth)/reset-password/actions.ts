'use server';

import { createClient } from '@/lib/supabase/server';

export type UpdatePasswordResult = {
  success: boolean;
  error?: string;
};

export async function updatePassword(password: string): Promise<UpdatePasswordResult> {
  const supabase = await createClient();

  // Verify the user has a valid (recovery) session before allowing password change
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'SESSION_EXPIRED' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  // Revoke ALL sessions globally (including other devices) so the user must log in fresh
  await supabase.auth.signOut({ scope: 'global' });

  return { success: true };
}
