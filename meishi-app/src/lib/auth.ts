export function getUserEmail(request: Request): string | null {
  const cfEmail = request.headers.get('cf-access-authenticated-user-email');
  if (cfEmail) return cfEmail;
  if (process.env.NODE_ENV === 'development') {
    return process.env.DEV_USER_EMAIL ?? 'dev@example.com';
  }
  return null;
}
