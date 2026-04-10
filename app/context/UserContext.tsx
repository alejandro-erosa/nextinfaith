"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// ── Standalone auth helpers (usable outside UserProvider) ─────────────────
// Single place with all supabase.auth calls — swap here if auth provider changes.

export const authSignIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const authSignUp = (params: {
  email: string;
  password: string;
  options?: { data?: Record<string, unknown> };
}) => supabase.auth.signUp(params);

export const authSignOut = () => supabase.auth.signOut();

export const authGetUser = () => supabase.auth.getUser();

export const authUpdatePassword = (password: string) =>
  supabase.auth.updateUser({ password });

export const authOnAuthStateChange = (
  // Accept both sync and async callbacks — Supabase's type requires Promise<void> but sync works at runtime
  callback: (...args: Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>) => void | Promise<void>
) => supabase.auth.onAuthStateChange(callback as Parameters<typeof supabase.auth.onAuthStateChange>[0]);

// ── Context ───────────────────────────────────────────────────────────────

type UserContextType = {
  userId: string;
  userEmail: string;
  userNombre: string;
  userInitials: string;
  userRol: string;
  requiereAprobacion: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  userId: "",
  userEmail: "",
  userNombre: "",
  userInitials: "--",
  userRol: "",
  requiereAprobacion: true,
  loading: true,
  signOut: async () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userNombre, setUserNombre] = useState("");
  const [userInitials, setUserInitials] = useState("--");
  const [userRol, setUserRol] = useState("");
  const [requiereAprobacion, setRequiereAprobacion] = useState(true);
  const [loading, setLoading] = useState(true);

  const inicializar = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/portal"); return; }

    const email = session.user.email ?? "";
    setUserId(session.user.id);
    setUserEmail(email);

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, apellido, requiere_aprobacion")
      .eq("id", session.user.id)
      .single();

    if (perfil) {
      setUserNombre(`${perfil.nombre} ${perfil.apellido}`);
      setUserInitials(`${perfil.nombre[0]}${perfil.apellido[0]}`.toUpperCase());
      setRequiereAprobacion(perfil.requiere_aprobacion ?? true);
    } else {
      const parts = email.split("@")[0].split(/[._-]/);
      setUserInitials(parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : email.slice(0, 2).toUpperCase());
    }

    const { data: rolData } = await supabase
      .from("user_roles")
      .select("roles(nombre)")
      .eq("user_id", session.user.id)
      .single();

    setUserRol((rolData?.roles as any)?.nombre ?? "editor");
    setLoading(false);
  }, [router]);

  useEffect(() => { inicializar(); }, [inicializar]);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  return (
    <UserContext.Provider value={{ userId, userEmail, userNombre, userInitials, userRol, requiereAprobacion, loading, signOut }}>
      {children}
    </UserContext.Provider>
  );
}
