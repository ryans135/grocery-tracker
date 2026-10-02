// AuthGate.jsx — renders the app only for a signed-in household member.
// Real protection is the RLS in supabase/auth-lockdown.sql; this is just the UI.

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { LoginModal } from "./modals";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [check, setCheck] = useState({ uid: null, ok: null }); // household check, per user
  const [rejected, setRejected] = useState(null); // email that signed in but isn't allowed

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  const email = session?.user.email;
  useEffect(() => {
    if (!uid) return;
    // If the helper isn't installed yet, don't block — RLS decides either way.
    supabase.rpc("is_household").then(({ data, error }) => {
      const ok = error ? true : !!data;
      if (!ok) { setRejected(email); supabase.auth.signOut(); }
      setCheck({ uid, ok });
    });
  }, [uid, email]);

  const allowed = session && check.uid === uid ? check.ok : null;

  if (session === undefined || (session && allowed === null)) {
    return <div className="gt-app" style={{ display: 'flex', justifyContent: 'center', paddingTop: '30vh' }}><span className="spin" /></div>;
  }

  if (!session || !allowed) {
    return (
      <div className="gt-app">
        <LoginModal notice={rejected ? `${rejected} isn't on the household list.` : null} />
      </div>
    );
  }

  return children;
}
