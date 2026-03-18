import Image from "next/image"
          
export default function Portal() {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{background: "linear-gradient(170deg, #1a3a6b 0%, #1a6b8c 40%, #4aa8d8 100%)"}}>
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md mx-6">
          <div className="flex justify-center mb-6">
             <Image src="/logo_transparente.png" alt="Next In Faith" width={100} height={100} />
          </div>
          <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2 text-center">Portal</h1>
          <p className="text-[#4a6278] text-center mb-8 text-sm">Acceso para organizadores y equipo</p>
            <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-[#1a3a6b] mb-1 block">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4aa8d8]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1a3a6b] mb-1 block">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4aa8d8]"
              />
            </div>
            <button className="w-full bg-[#e8a020] text-white font-bold py-3 rounded-xl hover:bg-[#f5c060] transition-all mt-2">
              Entrar
            </button>
          </div>
  
          <p className="text-center text-xs text-[#4a6278] mt-6">
            ¿Problemas para acceder? <a href="#" className="text-[#4aa8d8] font-semibold">Contáctanos</a>
          </p>
        </div>
      </main>
    );
  }