import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/games.routes.js";
import genreRoutes from "./routes/genres.routes.js";
import platformRoutes from "./routes/platforms.routes.js";
import libraryRoutes from "./routes/library.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "GameLibrary API está funcionando!",
    version: "1.0.0",
    endpoints: ["/auth", "/games", "/genres", "/platforms", "/library"],
  });
});

app.use("/auth", authRoutes);
app.use("/games", gameRoutes);
app.use("/genres", genreRoutes);
app.use("/platforms", platformRoutes);
app.use("/library", libraryRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.status ? err.message : "Erro interno do servidor.",
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`GameLibrary API rodando em http://localhost:${port}`);
});
