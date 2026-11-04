import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('fp:logout', onLogout);
    (async () => {
      if (getToken()) {
        try { setUser(await api('/auth/me')); } catch { setToken(null); }
      }
      setReady(true);
    })();
    return () => window.removeEventListener('fp:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}
