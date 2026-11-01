export function getJwtSecretBytes(): Uint8Array | null {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'fallback-secret-key-123');
  return secret ? new TextEncoder().encode(secret) : null;
}
