// js/data.js
import { supabase } from './supabaseClient.js';

// ---- Current user ----
export let currentUser = null;

// ---- Auth functions ----
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Fetch user role from public.users – use maybeSingle()
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userError) throw userError;
  if (!userData) throw new Error('User profile not found. Please contact support.');

  currentUser = userData;
  sessionStorage.setItem('clinicalflow_user', JSON.stringify(currentUser));
  return currentUser;
}

export async function signUp(email, password, role, name, program) {
  // 1. Sign up user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Failed to create user account.');

  // 2. Insert into public.users
  const { error: insertError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, email, role, name, program }]);
  if (insertError) throw insertError;

  // 3. If student, also insert into students table
  if (role === 'student') {
    const { error: studentError } = await supabase
      .from('students')
      .insert([{ id: data.user.id, program, year: 1 }]);
    if (studentError) throw studentError;
  }

  // 4. Auto sign-in (if email confirmation disabled)
  await supabase.auth.signInWithPassword({ email, password });

  // 5. Fetch the newly created user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userError) throw userError;
  if (!userData) throw new Error('Failed to retrieve user profile after sign-up.');

  currentUser = userData;
  sessionStorage.setItem('clinicalflow_user', JSON.stringify(currentUser));
  return currentUser;
}

export function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = sessionStorage.getItem('clinicalflow_user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
}

export async function logout() {
  await supabase.auth.signOut();
  sessionStorage.removeItem('clinicalflow_user');
  currentUser = null;
  window.location.href = 'index.html';
}

// ---- Data fetching functions ----
export async function getStudent(id) {
  // Use maybeSingle() to avoid error if no row
  const { data, error } = await supabase
    .from('students')
    .select('*, users(name, program)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // If no student record, return a default object (or throw)
    return { id, name: 'Unknown', program: 'BSN', year: 1 };
  }
  return { ...data, name: data.users?.name || 'Unknown', program: data.users?.program || 'BSN' };
}

export async function getProgress(studentId) {
  const { data, error } = await supabase
    .from('required_cases')
    .select(`
      id,
      name,
      case_progress!left(completed, verified_by)
    `)
    .eq('case_progress.student_id', studentId);

  if (error) throw error;
  const cases = data.map(c => ({
    name: c.name,
    completed: c.case_progress?.[0]?.completed || false,
    verifiedBy: c.case_progress?.[0]?.verified_by || null
  }));
  return { studentId, cases };
}

export async function getSchedules(studentId) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('student_id', studentId);
  if (error) throw error;
  return data;
}

export async function getAllSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select('*, users(name)');
  if (error) throw error;
  return data.map(s => ({ ...s, studentName: s.users?.name }));
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function markRead(notifId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId);
  if (error) throw error;
}

export async function getOpenSlots() {
  const { data, error } = await supabase
    .from('open_slots')
    .select('*')
    .order('date');
  if (error) throw error;
  return data;
}

export async function getStudentsByIds(ids) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .in('id', ids);
  if (error) throw error;
  return data;
}

// Export supabase instance for other modules
export { supabase };