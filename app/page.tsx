import Image from "next/image";

export default function Home() {
  const categorias = [
    { name: "Retiros", color: "#1a3a6b", light: "#dff0fb" },
    { name: "Conciertos", color: "#1a9b8c", light: "#d0f0ec" },
    { name: "Conferencias", color: "#4aa8d8", light: "#dff0fb" },
    { name: "Peregrinaciones", color: "#e8a020", light: "#fdf3dc" },
    { name: "Juveniles", color: "#1a3a6b", light: "#dff0fb" },
    { name: "Masivos", color: "#1a9b8c", light: "#d0f0ec" },
  ];

  return (
    <main className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-sm shadow-sm"
          style={{background: "linear-gradient(90deg, #1a3a6b 0%, #1a6b8c 100%)"}}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_transparente.png"
              alt="Next In Faith"
              width={70}
              height={70}
            />
            <span className="font-bold text-lg text-white">Next In Faith</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white">
            <a href="#" className="hover:text-[#4aa8d8] transition-colors">Acerca de</a>
            <a href="#" className="hover:text-[#4aa8d8] transition-colors">Contáctanos</a>
            <a href="/portal" className="hover:text-white transition-colors">Portal</a> 
            <a href="#" className="border border-[#4aa8d8] text-[#4aa8d8] px-4 py-2 rounded-full hover:bg-[#4aa8d8] hover:text-white transition-all">Sign In</a>
            <a href="#" className="bg-[#e8a020] text-white px-4 py-2 rounded-full hover:bg-[#f5c060] transition-all">Sign Up</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center">
        <Image
          src="/background.jpg"
          alt="Evento católico"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a6b]/70 via-black/40 to-[#1a9b8c]/60" />
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
            Next In Faith
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-widest drop-shadow-md">
            Donde la fe cobra vida
          </p>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section
        className="py-20 px-6"
        style={{
          background: "linear-gradient(170deg, #1a3a6b 0%, #1a6b8c 40%, #4aa8d8 75%, #dff0fb 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Descubre eventos católicos
          </h2>
          <p className="text-center text-white/80 mb-12">
            Encuentra retiros, conciertos, conferencias y más cerca de ti
          </p>

          {/* CARRUSEL */}
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {categorias.map((cat) => (
              <div
                key={cat.name}
                className="snap-start flex-shrink-0 w-56 h-72 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg relative"
                style={{ backgroundColor: cat.color }}
              >
                {/* Placeholder visual */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at 30% 70%, white 0%, transparent 60%)`,
                  }}
                />
                {/* Nombre de categoría */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-bold text-lg">{cat.name}</p>
                  <p className="text-white/70 text-xs mt-1">Ver eventos →</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}