
import { Router } from "express";
import prisma from "../db.js";
import auth from "../middlewares/auth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(auth);

function isValidId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

// Listar plataformas
router.get("/", asyncHandler(async (req, res) => {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" }
  });

  res.json(platforms);
}));

// Buscar plataforma por ID
router.get("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const platform = await prisma.platform.findUnique({
    where: { id },
    include: {
      games: {
        include: { game: true }
      }
    }
  });

  if (!platform) {
    return res.status(404).json({
      error: "Plataforma não encontrada."
    });
  }

  res.json(platform);
}));

// Cadastrar plataforma
router.post("/", asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      error: "Informe um nome válido para a plataforma."
    });
  }

  const normalizedName = name.trim();

  const exists = await prisma.platform.findUnique({
    where: { name: normalizedName }
  });

  if (exists) {
    return res.status(409).json({
      error: "Essa plataforma já está cadastrada."
    });
  }

  const platform = await prisma.platform.create({
    data: { name: normalizedName }
  });

  res.status(201).json(platform);
}));

// Atualizar plataforma
router.put("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      error: "Informe um nome válido para a plataforma."
    });
  }

  const exists = await prisma.platform.findUnique({
    where: { id }
  });

  if (!exists) {
    return res.status(404).json({
      error: "Plataforma não encontrada."
    });
  }

  const normalizedName = name.trim();

  const duplicate = await prisma.platform.findFirst({
    where: {
      name: normalizedName,
      NOT: { id }
    }
  });

  if (duplicate) {
    return res.status(409).json({
      error: "Já existe outra plataforma com esse nome."
    });
  }

  const platform = await prisma.platform.update({
    where: { id },
    data: { name: normalizedName }
  });

  res.json(platform);
}));

// Excluir plataforma
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const exists = await prisma.platform.findUnique({
    where: { id }
  });

  if (!exists) {
    return res.status(404).json({
      error: "Plataforma não encontrada."
    });
  }

  await prisma.platform.delete({
    where: { id }
  });

  res.json({
    message: "Plataforma removida com sucesso."
  });
}));

export default router;
