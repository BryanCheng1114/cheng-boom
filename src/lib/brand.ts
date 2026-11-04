export const DEFAULT_BUSINESS_NAME = 'Dolphin Firework';

export function resolveBusinessName(name?: string | null): string {
  const trimmedName = name?.trim();
  if (!trimmedName || /cheng[\s-]*boom/i.test(trimmedName)) {
    return DEFAULT_BUSINESS_NAME;
  }
  return trimmedName;
}
