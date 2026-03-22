"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type UserContextType = {
  userId: string;
  userEmail: string;
  userNombre: string;
  userInitials: string;
  userRol: string;
  requiereAprobacion: boolean;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  userId: "",
  userEmail: "",
  userNombre: "",
  userInitials: "--",
  userRol: "editor",
  requiereAprobacion: true,
  loading: true,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userNombre, setUserNombre] = useState("");
  const [userInitials, setUserInitials] = useState("--");
  const [userRol, setUserRol] = useState("editor");
  const [requiereAprobacion, setRequiereAprobacion] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => { inicializar(); }, []);

  const inicializar = async () => {
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
  };

  return (
    <UserContext.Provider value={{ userId, userEmail, userNombre, userInitials, userRol, requiereAprobacion, loading }}>
      {children}
    </UserContext.Provider>
  );
}