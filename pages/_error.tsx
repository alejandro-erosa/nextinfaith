function Error({ statusCode }: { statusCode?: number }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 48, margin: 0 }}>{statusCode || "Error"}</h1>
      <p style={{ color: "#666" }}>
        {statusCode === 404 ? "Página no encontrada" : "Ocurrió un error"}
      </p>
      <a href="/" style={{ color: "#1a3a6b", fontWeight: 600 }}>Volver al inicio</a>
    </main>
  );
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
