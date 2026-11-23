
import { Router } from "express";
import prisma from "../db.js";
import auth from "../middlewares/auth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(auth);

// Validar IDs inteiros positivos
function isValidId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

// Listar todos os jogos
router.get("/", asyncHandler(async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      genre: true,
      platforms: {
        include: { platform: true }
      }
    },
    orderBy: { title: "asc" }
  });

  res.json(games);
}));

// Buscar jogo por ID
router.get("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      genre: true,
      platforms: {
        include: { platform: true }
      }
    }
  });

  if (!game) {
    return res.status(404).json({ error: "Jogo não encontrado." });
  }

  res.json(game);
}));

// Cadastrar jogo
router.post("/", asyncHandler(async (req, res) => {
  const {
    title,
    description,
    releaseYear,
    genreId,
    platformIds = []
  } = req.body;

  if (typeof title !== "string" || !title.trim() || !genreId) {
    return res.status(400).json({
      error: "title e genreId são obrigatórios."
    });
  }

  if (!isValidId(genreId)) {
    return res.status(400).json({ error: "genreId inválido." });
  }

  if (!Array.isArray(platformIds)) {
    return res.status(400).json({
      error: "platformIds deve ser uma lista."
    });
  }

  const validPlatforms = platformIds.map(Number);

  if (
    validPlatforms.some(id => !isValidId(id)) ||
    new Set(validPlatforms).size !== validPlatforms.length
  ) {
    return res.status(400).json({
      error: "platformIds deve conter IDs válidos e sem repetições."
    });
  }

  const year = releaseYear ? Number(releaseYear) : null;

  if (year !== null && (!Number.isInteger(year) || year < 1800)) {
    return res.status(400).json({
      error: "releaseYear deve ser um ano válido."
    });
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return res.status(400).json({
      error: "description deve ser um texto."
    });
  }

  const game = await prisma.game.create({
    data: {
      title: title.trim(),
      description: description ? description : null,
      releaseYear: year,
      genreId: Number(genreId),
      platforms: {
        create: validPlatforms.map(platformId => ({
          platform: {
            connect: { id: platformId }
          }
        }))
      }
    },
    include: {
      genre: true,
      platforms: {
        include: { platform: true }
      }
    }
  });

  res.status(201).json(game);
}));

// Atualizar jogo
router.put("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const current = await prisma.game.findUnique({
    where: { id }
  });

  if (!current) {
    return res.status(404).json({ error: "Jogo não encontrado." });
  }

  const {
    title,
    description,
    releaseYear,
    genreId,
    platformIds
  } = req.body;

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return res.status(400).json({
      error: "title não pode ser vazio."
    });
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return res.status(400).json({
      error: "description deve ser um texto."
    });
  }

  if (genreId !== undefined && !isValidId(genreId)) {
    return res.status(400).json({ error: "genreId inválido." });
  }

  if (platformIds !== undefined && !Array.isArray(platformIds)) {
    return res.status(400).json({
      error: "platformIds deve ser uma lista."
    });
  }

  const validPlatforms = platformIds?.map(Number);

  if (
    validPlatforms &&
    (
      validPlatforms.some(platformId => !isValidId(platformId)) ||
      new Set(validPlatforms).size !== validPlatforms.length
    )
  ) {
    return res.status(400).json({
      error: "platformIds deve conter IDs válidos e sem repetições."
    });
  }

  let year;

  if (releaseYear !== undefined) {
    year = releaseYear === null || releaseYear === ""
      ? null
      : Number(releaseYear);

    if (year !== null && (!Number.isInteger(year) || year < 1800)) {
      return res.status(400).json({
        error: "releaseYear deve ser um ano válido."
      });
    }
  }

  const game = await prisma.game.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined
        ? { description: description ? description : null }
        : {}),
      ...(releaseYear !== undefined ? { releaseYear: year } : {}),
      ...(genreId !== undefined ? { genreId: Number(genreId) } : {}),
      ...(platformIds !== undefined
        ? {
            platforms: {
              deleteMany: {},
              create: validPlatforms.map(platformId => ({
                platform: {
                  connect: { id: platformId }
                }
              }))
            }
          }
        : {})
    },
    include: {
      genre: true,
      platforms: {
        include: { platform: true }
      }
    }
  });

  res.json(game);
}));

// Excluir jogo
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const current = await prisma.game.findUnique({
    where: { id }
  });

  if (!current) {
    return res.status(404).json({ error: "Jogo não encontrado." });
  }

  await prisma.game.delete({
    where: { id }
  });

  res.json({
    message: "Jogo removido com sucesso."
  });
}));

export default router;
