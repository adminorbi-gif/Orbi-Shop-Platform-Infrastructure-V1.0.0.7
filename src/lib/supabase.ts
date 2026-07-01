const authListeners = new Set<Function>();

export const supabase = {
  auth: {
    getSession: async () => {
      const session = localStorage.getItem('orbi_session');
      return { data: { session: session ? JSON.parse(session) : null } };
    },
    setSession: async (session: any) => {
      localStorage.setItem('orbi_session', JSON.stringify(session));
      authListeners.forEach(listener => listener('SIGNED_IN', session));
      return { data: { session }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('orbi_session');
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },
    onAuthStateChange: (listener: Function) => {
      authListeners.add(listener);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(listener) } } };
    },
    updateUser: async (attributes: any) => {
      const token = localStorage.getItem('orbi_session') 
        ? JSON.parse(localStorage.getItem('orbi_session')!).access_token 
        : '';
        
      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(attributes),
      });
      return await res.json();
    }
  },
  storage: new Proxy({}, {
    get: () => {
      throw new Error("Storage direct access disabled. Use /api/v1/storage/* backend API");
    }
  })
} as any;

export const db = new Proxy({}, {
  get: () => {
    throw new Error("Database direct access is disabled from browser. Use backend API.");
  }
});
