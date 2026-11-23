
import { Router } from "express";
import prisma from "../db.js";
import auth from "../middlewares/auth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();
router.use(auth);

// Listar gêneros
router.get("/", asyncHandler(async (req, res) => {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" }
  });
  res.json(genres);
}));

// Buscar gênero por ID
router.get("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const genre = await prisma.genre.findUnique({
    where: { id },
    include: { games: true }
  });

  if (!genre) {
    return res.status(404).json({ error: "Gênero não encontrado." });
  }

  res.json(genre);
}));

// Cadastrar gênero
router.post("/", asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Informe o nome do gênero." });
  }

  const genre = await prisma.genre.create({
    data: { name }
  });

  res.status(201).json(genre);
}));

// Atualizar gênero
router.put("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido." });
  }

  if (!name) {
    return res.status(400).json({ error: "Informe o nome do gênero." });
  }

  const exists = await prisma.genre.findUnique({
    where: { id }
  });

  if (!exists) {
    return res.status(404).json({ error: "Gênero não encontrado." });
  }

  const genre = await prisma.genre.update({
    where: { id },
    data: { name }
  });

  res.json(genre);
}));

// Excluir gênero
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const exists = await prisma.genre.findUnique({
    where: { id }
  });

  if (!exists) {
    return res.status(404).json({ error: "Gênero não encontrado." });
  }

  const used = await prisma.game.count({
    where: { genreId: id }
  });

  if (used) {
    return res.status(409).json({
      error: "Não é possível excluir: existem jogos usando este gênero."
    });
  }

  await prisma.genre.delete({
    where: { id }
  });

  res.json({ message: "Gênero removido com sucesso." });
}));

export default router;
