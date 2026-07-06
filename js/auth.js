// js/auth.js
import { getCurrentUser as getSupabaseUser } from './data.js';

export function getCurrentUser() {
  return getSupabaseUser();
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

export function requireRole(allowedRoles) {
  const user = requireAuth();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    alert('Access denied. You do not have permission for this page.');
    window.location.href = 'student-dashboard.html';
    return null;
  }
  return user;
}