import { supabase } from './supabase';

export type StaffRole = 'owner' | 'waiter';

export interface StaffProfile {
  id: string;
  email: string;
  role: StaffRole;
  created_at: string;
  display_name?: string;
  pin?: string;
}

// ── Auth Functions ──

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ── Staff Profile Functions ──

export async function getStaffRole(): Promise<StaffRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data.role as StaffRole;
}

export async function getStaffProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from('staff_public')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as StaffProfile[];
}

// ── Invite Staff (calls Edge Function) ──

export async function inviteStaff(email: string, role: StaffRole, password?: string): Promise<{ message: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const response = await supabase.functions.invoke('invite-staff', {
    body: { email, role, password },
  });

  if (response.error) {
    const errorMsg = (response.error as any).message || 'Error al invitar al usuario';
    throw new Error(errorMsg);
  }

  const result = response.data;
  if (result.error) {
    throw new Error(result.error);
  }

  return {
    message: result.message,
  };
}

// ── Delete Staff ──

export async function deleteStaff(staffId: string) {
  const { error } = await supabase
    .from('staff_profiles')
    .delete()
    .eq('id', staffId);

  if (error) throw error;
}

// ── PIN & Tablet Logic ──

export function isTabletAuthorized(): boolean {
  return localStorage.getItem('is_trusted_tablet') === 'true';
}

export function authorizeTablet() {
  localStorage.setItem('is_trusted_tablet', 'true');
}

export function deauthorizeTablet() {
  localStorage.removeItem('is_trusted_tablet');
}

export function getActiveStaffId(): string | null {
  return localStorage.getItem('active_staff_id');
}

export function setActiveStaffId(id: string | null) {
  if (id) {
    localStorage.setItem('active_staff_id', id);
  } else {
    localStorage.removeItem('active_staff_id');
  }
}

export async function verifyStaffPin(staffId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_staff_pin', {
    p_staff_id: staffId,
    p_pin: pin
  });

  if (error) throw error;
  return !!data;
}

export async function updateStaffProfile(staffId: string, updates: Partial<Pick<StaffProfile, 'display_name' | 'pin'>>) {
  const { error } = await supabase
    .from('staff_profiles')
    .update(updates)
    .eq('id', staffId);

  if (error) throw error;
}

// ── Update Password ──

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── Auth State Listener ──

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
