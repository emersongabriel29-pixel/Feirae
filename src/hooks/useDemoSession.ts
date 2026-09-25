import type { Role } from "../types";
import { nameFromEmail, readSession } from "../domain/session";
import { usePersistentState } from "../usePersistentState";

export function useDemoSession() {
  const [storedSession, setStoredSession] = usePersistentState<unknown>("feirae:session", null);
  const session = readSession(storedSession);
  const role = session?.role ?? null;

  function startSession(nextRole: Role, email: string) {
    setStoredSession({ role: nextRole, email, name: nameFromEmail(email) });
  }

  function clearSession() {
    setStoredSession(null);
  }

  return {
    session,
    role,
    startSession,
    clearSession,
  };
}
