import { supabase, refreshSupabaseAuth } from './supabase';

export type StaffRole = 'owner' | 'waiter';

export interface StaffProfile {
  id: string;
  email: string;
  role: StaffRole;
  created_at: string;
  display_name?: string;
  pin?: string;
}

// ── Auth Functions (Custom Local Storage) ──

const SESSION_KEY = 'el_atlante_staff_session';

export function getSession() {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr) as Partial<StaffProfile>;
  } catch {
    return null;
  }
}

export function getUser() {
  return getSession();
}

export function getStaffRole(): StaffRole | null {
  const session = getSession();
  return session?.role || null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.rpc('login_staff', {
    p_email: email,
    p_password: password
  });

  if (error) throw new Error(error.message);
  
  if (data?.error) throw new Error(data.error);
  
  // Successful login, data is the user profile
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  refreshSupabaseAuth();
  return data;
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  setActiveStaffId(null);
  refreshSupabaseAuth();
}

// ── Staff Profile Functions ──

export async function getStaffProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase.rpc('get_staff_public_safe');

  if (error) throw error;
  return (data || []) as StaffProfile[];
}

export async function inviteStaff(email: string, role: StaffRole, password: string): Promise<{ message: string }> {
  const session = getSession();
  if (!session || session.role !== 'owner') {
    throw new Error('Solo los administradores pueden invitar');
  }

  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const { data, error } = await supabase.rpc('invite_staff_custom', {
    p_email: email,
    p_password: password,
    p_role: role,
    p_display_name: email.split('@')[0]
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  return { message: 'Usuario creado con éxito' };
}

export async function deleteStaff(staffId: string) {
  const { data, error } = await supabase.rpc('delete_staff_secure', {
    p_staff_id: staffId
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
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

export interface PinSignInResult {
  role: StaffRole;
  display_name?: string;
  email: string;
}

export async function pinSignIn(staffId: string, pin: string): Promise<PinSignInResult> {
  const { data, error } = await supabase.rpc('verify_staff_pin_custom', {
    p_staff_id: staffId,
    p_pin: pin
  });

  if (error) throw new Error('Error al verificar PIN');
  if (data?.error) throw new Error(data.error);

  // Success, save custom session
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  refreshSupabaseAuth();

  return { role: data.role as StaffRole, display_name: data.display_name, email: data.email };
}

export async function updateStaffPin(staffId: string, pin: string) {
  const { data, error } = await supabase.rpc('update_staff_pin_custom', {
    p_staff_id: staffId,
    p_pin: pin
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export async function updateStaffProfile(staffId: string, updates: Partial<Pick<StaffProfile, 'display_name' | 'pin'>>) {
  // If pin is included, handle it separately via RPC to ensure hashing
  if (updates.pin) {
    await updateStaffPin(staffId, updates.pin);
    delete updates.pin;
  }

  // If there are other updates (like display_name), do them
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('staff_profiles')
      .update(updates)
      .eq('id', staffId);

    if (error) throw error;
  }
}

export async function updatePassword(newPassword: string) {
  const session = getSession();
  if (!session?.id) throw new Error('No hay sesión activa');

  const { data, error } = await supabase.rpc('update_staff_password', {
    p_staff_id: session.id,
    p_new_password: newPassword
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export function onAuthStateChange() {
  // Mock function, no longer hooked to Supabase
  return { data: { subscription: { unsubscribe: () => {} } } };
}
