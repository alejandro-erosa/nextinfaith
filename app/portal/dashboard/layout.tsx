"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";

type NavItem = { label: string; href: string };
type NavGroup = { section: string; items: NavItem[] };

const NAV_SUPER_ADMIN: NavGroup[] = [
  { section: "Principal", items: [
    { label: "Eventos", href: "/portal/dashboard" },
    { label: "Reseñas", href: "/portal/dashboard/resenas" },
    { label: "Cobertura", href: "/portal/dashboard/cobertura" },
  ]},
  { section: "Gestión", items: [
    { label: "Organizadores", href: "/portal/dashboard/organizadores" },
    { label: "Usuarios", href: "/portal/dashboard/usuarios" },
    { label: "Pagos", href: "/portal/dashboard/pagos" },
    { label: "Publicidad", href: "/portal/dashboard/publicidad" },
  ]},
];

const NAV_ADMIN: NavGroup[] = [
  { section: "Principal", items: [
    { label: "Eventos", href: "/portal/dashboard" },
    { label: "Reseñas", href: "/portal/dashboard/resenas" },
    { label: "Cobertura", href: "/portal/dashboard/cobertura" },
  ]},
  { section: "Gestión", items: [
    { label: "Organizadores", href: "/portal/dashboard/organizadores" },
    { label: "Usuarios", href: "/portal/dashboard/usuarios" },
    { label: "Pagos", href: "/portal/dashboard/pagos" },
    { label: "Publicidad", href: "/portal/dashboard/publicidad" },
  ]},
];

const NAV_EDITOR: NavGroup[] = [
  { section: "Principal", items: [
    { label: "Eventos", href: "/portal/dashboard" },
    { label: "Reseñas", href: "/portal/dashboard/resenas" },
    { label: "Cobertura", href: "/portal/dashboard/cobertura" },
  ]},
];

const NAV_MODERADOR: NavGroup[] = [
  { section: "Principal", items: [
    { label: "Eventos", href: "/portal/dashboard" },
    { label: "Reseñas", href: "/portal/dashboard/resenas" },
  ]},
];

const NAV_ORGANIZADOR: NavGroup[] = [
  { section: "Mis datos", items: [
    { label: "Mis eventos", href: "/portal/dashboard" },
    { label: "Mis reseñas", href: "/portal/dashboard/resenas" },
  ]},
];

const NAV_BY_ROL: Record<string, NavGroup[]> = {
  super_admin: NAV_SUPER_ADMIN,
  admin:       NAV_ADMIN,
  editor:      NAV_EDITOR,
  moderador:   NAV_MODERADOR,
  organizador: NAV_ORGANIZADOR,
};

const ROL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin:       "Admin",
  editor:      "Editor",
  moderador:   "Moderador",
  organizador: "Organizador",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("--");
  const [userNombre, setUserNombre] = useState("");
  const [userRol, setUserRol] = useState("editor");
  const [navItems, setNavItems] = useState<NavGroup[]>(NAV_EDITOR);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/portal"); return; }

    const email = session.user.email ?? "";
    setUserEmail(email);

    const parts = email.split("@")[0].split(/[._-]/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : email.slice(0, 2).toUpperCase();
    setUserInitials(initials);

    // Leer perfil
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, apellido")
      .eq("id", session.user.id)
      .single();

    if (perfil) {
      setUserNombre(`${perfil.nombre} ${perfil.apellido}`);
      const ini = `${perfil.nombre[0]}${perfil.apellido[0]}`.toUpperCase();
      setUserInitials(ini);
    }

    // Leer rol
    const { data: rolData } = await supabase
      .from("user_roles")
      .select("roles(nombre)")
      .eq("user_id", session.user.id)
      .single();

    const rolNombre = (rolData?.roles as any)?.nombre ?? "editor";
    setUserRol(rolNombre);
    setNavItems(NAV_BY_ROL[rolNombre] ?? NAV_EDITOR);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/portal");
  };

  const isActive = (href: string) => {
    if (href === "/portal/dashboard") return pathname === "/portal/dashboard";
    return pathname.startsWith(href);
  };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f6fb" }}>
      <div style={{ fontSize: 13, color: "#4a6278" }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f6fb" }}>
      <aside style={{ width: 210, minWidth: 210, background: "#1a3a6b", display: "flex", flexDirection: "column" }}>

        {/* Logo */}
        <div style={{ padding: "18px 16px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo_transparente.png" alt="Next In Faith" width={32} height={32} style={{ borderRadius: 4 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Next In Faith</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Donde la fe cobra vida</div>
            </div>
          </div>
        </div>

        {/* Rol badge + usuario */}
        <div style={{ padding: "8px 16px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.12)" }}>
          <span style={{
            fontSize: 10, background: "rgba(74,168,216,0.2)", color: "#4aa8d8",
           padding: "2px 8px", borderRadius: 99, fontWeight: 500
         }}>
            {ROL_LABEL[userRol] ?? userRol}
          </span>
          <div style={{ marginTop: 8 }}>
           <div style={{ fontSize: 12, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userNombre || userEmail}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2, gap: 8 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                 {userEmail}
            </div>
           <button onClick={handleLogout} style={{
             background: "none", border: "none", cursor: "pointer",
             color: "rgba(255,255,255,0.4)", fontSize: 11, padding: 0, flexShrink: 0
              }}>
             Salir
           </button>
          </div>
         </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map((group) => (
            <div key={group.section}>
              <div style={{
                fontSize: 10, color: "rgba(255,255,255,0.4)",
                padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: "0.06em"
              }}>
                {group.section}
              </div>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 16px", fontSize: 13,
                    color: isActive(item.href) ? "#fff" : "rgba(255,255,255,0.65)",
                    background: isActive(item.href) ? "rgba(255,255,255,0.14)" : "transparent",
                    fontWeight: isActive(item.href) ? 500 : 400,
                    cursor: "pointer", transition: "background 0.1s",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                      background: isActive(item.href) ? "#4aa8d8" : "rgba(255,255,255,0.25)"
                    }} />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </nav>

       
      </aside>

      <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
