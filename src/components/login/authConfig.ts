export const DEMO_CREDENTIALS = {
  email: 'bikashtalukder040@gmail.com',
  password: 'dhurr miya500'
} as const;

const SESSION_FLAG_KEY = 'swasti_demo_auth_session_v1';

export function isDemoAuthenticated(): boolean {
  try {
    return (
      localStorage.getItem(SESSION_FLAG_KEY) === 'true' ||
      sessionStorage.getItem(SESSION_FLAG_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

export function saveDemoSession(keepSignedIn: boolean): void {
  try {
    if (keepSignedIn) {
      localStorage.setItem(SESSION_FLAG_KEY, 'true');
      sessionStorage.removeItem(SESSION_FLAG_KEY);
    } else {
      sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
      localStorage.removeItem(SESSION_FLAG_KEY);
    }
  } catch {
    // Storage restricted
  }
}

export function clearDemoSession(): void {
  try {
    localStorage.removeItem(SESSION_FLAG_KEY);
    sessionStorage.removeItem(SESSION_FLAG_KEY);
  } catch {
    // Storage restricted
  }
}
