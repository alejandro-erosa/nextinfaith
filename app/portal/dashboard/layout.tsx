"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { UserProvider, useUser } from "../../context/UserContext";

type NavItem  = { label: string; href: string };
type NavGroup = { section: string; items: NavItem[] };

const ROL_LABEL: Record<string, string> = {
  super_admin:  "Super Admin",
  admin:        "Admin",
  editor:       "Editor",
  moderador:    "Moderador",
  organizador:  "Organizador",
  corresponsal: "Corresponsal",
  influencer:   "Influencer",
};

function DashboardSidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { userEmail, userNombre, userRol, loading } = useUser();

  const [navGroups, setNavGroups]     = useState<NavGroup[]>([]);
  const [navLoading, setNavLoading]   = useState(true);
  
  useEffect(() => {
    console.log('userRol al cargar nav:', userRol);
    if (!userRol) return;
    cargarNav();
  }, [userRol]);
  useEffect(() => {
    if (!userRol) return;
    cargarNav();
  }, [userRol]);

  async function cargarNav() {
    setNavLoading(true);
    try {

      
      // 1. Obtener rol_id
      const { data: rolData } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', userRol)
        .single();


      if (!rolData) { setNavLoading(false); return; }
  
      // 2. Obtener permiso_ids del rol
      const { data: rpData } = await supabase
        .from('rol_permisos')
        .select('permiso_id')
        .eq('rol_id', rolData.id);
  
      
      const permisoIds = (rpData || []).map((r: any) => r.permiso_id);
      if (permisoIds.length === 0) { setNavLoading(false); return; }
  
      // 3. Obtener navegación
      const { data: navData } = await supabase
        .from('navegacion')
        .select('seccion, label, href, orden')
        .in('permiso_id', permisoIds)
        .order('orden');

       
  
      const grupos: Record<string, NavItem[]> = {};
      (navData || []).forEach((item: any) => {
        if (!grupos[item.seccion]) grupos[item.seccion] = [];
        grupos[item.seccion].push({ label: item.label, href: item.href });
      });
  
      setNavGroups(
        Object.entries(grupos).map(([section, items]) => ({ section, items }))
      );
    } finally {
      setNavLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/portal");
  };

  const isActive = (href: string) => {
    if (href === "/portal/dashboard") return pathname === "/portal/dashboard";
    return pathname?.startsWith(href) ?? false;
  };

  if (loading || navLoading) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f6fb" }}>
      <div style={{ fontSize: 13, color: "#4a6278" }}>Cargando...</div>
    </div>
  );

  return (
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

      {/* Usuario */}
      <div style={{ padding: "8px 16px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.12)" }}>
        <span style={{ fontSize: 10, background: "rgba(74,168,216,0.2)", color: "#4aa8d8", padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
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
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 11, padding: 0, flexShrink: 0 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Navegación dinámica */}
      <nav style={{ flex: 1, paddingTop: 4 }}>
        {navGroups.length === 0 ? (
          <div style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            Sin secciones asignadas
          </div>
        ) : (
          navGroups.map((group) => (
            <div key={group.section}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                    cursor: "pointer",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: isActive(item.href) ? "#4aa8d8" : "rgba(255,255,255,0.25)" }} />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </nav>
      {/* Ver sitio */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.12)", padding: "12px 16px" }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.25)" }} />
          Ver sitio
        </a>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f0f6fb" }}>
        <DashboardSidebar />
        <main style={{ flex: 1, minWidth: 0, overflow: "visible" }}>
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
