'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useUser } from '../../../context/UserContext'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  created_at: string
  activo: boolean
  requiere_aprobacion: boolean
  rol: string
  rol_id: number
}

interface Rol {
  id: number
  nombre: string
}

const ROLES_INTERNOS = ['super_admin', 'admin', 'editor', 'moderador', 'corresponsal']

export default function UsuariosPage() {
  const { userRol } = useUser()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

  // Modal nuevo usuario
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRolId, setNuevoRolId] = useState<number | ''>('')
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const [errorNuevo, setErrorNuevo] = useState('')

  // Modal cambiar rol
  const [modalRol, setModalRol] = useState<Usuario | null>(null)
  const [nuevoRolCambio, setNuevoRolCambio] = useState<number | ''>('')
  const [guardandoRol, setGuardandoRol] = useState(false)

  const esAdmin = userRol === 'admin' || userRol === 'super_admin'

  useEffect(() => {
    if (esAdmin) {
      cargarDatos()
    }
  }, [esAdmin])

  async function cargarDatos() {
    setLoading(true)
    try {
      // Cargar roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('id, nombre')
        .order('id')
      setRoles(rolesData || [])

      // Cargar usuarios con su rol
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, created_at, activo, requiere_aprobacion')
        .order('nombre')

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, rol_id, roles(nombre)')

      const usuariosConRol: Usuario[] = (perfiles || []).map((p: any) => {
        const ur = (userRoles || []).find((r: any) => r.user_id === p.id)
        const rolNombre = ur ? (ur.roles as any)?.nombre || '' : ''
        return {
          ...p,
          rol: rolNombre,
          rol_id: ur?.rol_id || 0,
        }
      }).filter((u: Usuario) => ROLES_INTERNOS.includes(u.rol))

      setUsuarios(usuariosConRol)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActivo(usuario: Usuario) {
    const nuevoValor = !usuario.activo
    await supabase
      .from('profiles')
      .update({ activo: nuevoValor })
      .eq('id', usuario.id)
    setUsuarios(prev =>
      prev.map(u => u.id === usuario.id ? { ...u, activo: nuevoValor } : u)
    )
  }

  async function toggleRequiereAprobacion(usuario: Usuario) {
    const nuevoValor = !usuario.requiere_aprobacion
    await supabase
      .from('profiles')
      .update({ requiere_aprobacion: nuevoValor })
      .eq('id', usuario.id)
    setUsuarios(prev =>
      prev.map(u => u.id === usuario.id ? { ...u, requiere_aprobacion: nuevoValor } : u)
    )
  }

  async function guardarNuevoUsuario() {
    if (!nuevoNombre || !nuevoEmail || !nuevoRolId) {
      setErrorNuevo('Nombre, email y rol son obligatorios.')
      return
    }
    setGuardandoNuevo(true)
    setErrorNuevo('')
    try {
      // Crear usuario en Supabase Auth via Admin API no disponible en cliente
      // Se usa signUp — el usuario recibirá correo de confirmación
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoEmail,
        password: Math.random().toString(36).slice(-10) + 'A1!',
        options: {
          data: { nombre: nuevoNombre, apellido: nuevoApellido }
        }
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('No se obtuvo ID de usuario')

      // Actualizar profile con nombre y apellido
      await supabase
        .from('profiles')
        .update({ nombre: nuevoNombre, apellido: nuevoApellido, cambio_clave: true, activo: true })
        .eq('id', userId)

      // Asignar rol
      await supabase
        .from('user_roles')
        .insert({ user_id: userId, rol_id: nuevoRolId })

      setModalNuevo(false)
      setNuevoNombre('')
      setNuevoApellido('')
      setNuevoEmail('')
      setNuevoRolId('')
      cargarDatos()
    } catch (err: any) {
      setErrorNuevo(err.message || 'Error al crear usuario.')
    } finally {
      setGuardandoNuevo(false)
    }
  }

  async function guardarCambioRol() {
    if (!modalRol || !nuevoRolCambio) return
    setGuardandoRol(true)
    try {
      await supabase
        .from('user_roles')
        .update({ rol_id: nuevoRolCambio })
        .eq('user_id', modalRol.id)
      setModalRol(null)
      setNuevoRolCambio('')
      cargarDatos()
    } finally {
      setGuardandoRol(false)
    }
  }

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    )
  }

  if (!esAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        No tienes permisos para ver esta sección.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de usuarios internos del sistema</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Rol</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Req. aprobación</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Activo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Registro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={u.requiere_aprobacion} onChange={() => toggleRequiereAprobacion(u)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={u.activo} onChange={() => toggleActivo(u)} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatFecha(u.created_at)}</td>
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() => setMenuAbierto(menuAbierto === u.id ? null : u.id)}
                      className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
                    >
                      ···
                    </button>
                    {menuAbierto === u.id && (
                      <div className="absolute right-4 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
                        <button
                          onClick={() => { setModalRol(u); setNuevoRolCambio(u.rol_id); setMenuAbierto(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cambiar rol
                        </button>
                        <button
                          onClick={() => { toggleActivo(u); setMenuAbierto(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="text-center py-10 text-gray-400">No hay usuarios registrados.</div>
          )}
        </div>
      )}

      {/* Modal nuevo usuario */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nuevo usuario</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Nombre(s)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevoApellido}
                  onChange={e => setNuevoApellido(e.target.value)}
                  placeholder="Apellido(s)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevoEmail}
                  onChange={e => setNuevoEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevoRolId}
                  onChange={e => setNuevoRolId(Number(e.target.value))}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.filter(r => ROLES_INTERNOS.includes(r.nombre)).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              {errorNuevo && <p className="text-red-500 text-xs">{errorNuevo}</p>}
              <p className="text-xs text-gray-400">El usuario recibirá un correo para confirmar su cuenta y deberá cambiar su contraseña en el primer acceso.</p>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setModalNuevo(false); setErrorNuevo('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarNuevoUsuario}
                disabled={guardandoNuevo}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoNuevo ? 'Guardando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar rol */}
      {modalRol && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Cambiar rol</h2>
            <p className="text-sm text-gray-500 mb-4">{modalRol.nombre} {modalRol.apellido}</p>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nuevoRolCambio}
              onChange={e => setNuevoRolCambio(Number(e.target.value))}
            >
              <option value="">Selecciona un rol</option>
              {roles.filter(r => ROLES_INTERNOS.includes(r.nombre)).map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setModalRol(null); setNuevoRolCambio('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambioRol}
                disabled={guardandoRol}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoRol ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar menú al click fuera */}
      {menuAbierto && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuAbierto(null)} />
      )}
    </div>
  )
}
