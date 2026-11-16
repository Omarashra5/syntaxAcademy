export interface AdminSessionStatus {
  authenticated: boolean;
  expiresAt: number | null;
  adminSdkReady: boolean;
  rotatedAt?: string;
}

export async function getAdminSessionStatus(): Promise<AdminSessionStatus> {
  const res = await fetch('/api/admin/session', { credentials: 'include' });
  if (!res.ok) {
    return { authenticated: false, expiresAt: null, adminSdkReady: false };
  }
  return res.json();
}

export async function loginAdminWithPassword(password: string): Promise<AdminSessionStatus> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed.');
  }
  return data;
}

export async function logoutAdminSession(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function rotateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; rotatedAt: string }> {
  const res = await fetch('/api/admin/rotate-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to rotate password.');
  }
  return data;
}

export async function validateCommentServer(content: string): Promise<string> {
  const res = await fetch('/api/comments/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok || !data.valid) {
    throw new Error(data.error || 'Comment rejected by validation.');
  }
  return data.sanitized;
}
