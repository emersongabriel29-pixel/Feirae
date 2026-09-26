import type { Role } from "../types";
import { nameFromEmail, readSession } from "../domain/session";
import { usePersistentState } from "../usePersistentState";

export function useDemoSession() {
  const [storedSession, setStoredSession] = usePersistentState<unknown>("feirae:session", null);
  const session = readSession(storedSession);
  const role = session?.role ?? null;

  function startSession(nextRole: Role, email: string, name?: string, isNewAccount = false) {
    setStoredSession({
      role: nextRole,
      email,
      name: name?.trim() || nameFromEmail(email),
      isNewAccount,
    });
  }

  function updateSession(update: Partial<Pick<NonNullable<typeof session>, "email" | "name">>) {
    if (!session) return;
    setStoredSession({
      ...session,
      ...update,
      isNewAccount: false,
    });
  }

  function clearSession() {
    setStoredSession(null);
  }

  return {
    session,
    role,
    startSession,
    updateSession,
    clearSession,
  };
}
