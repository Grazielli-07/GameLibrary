
import { Router } from "express";
import prisma from "../db.js";
import auth from "../middlewares/auth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(auth);

// Lista a biblioteca do usuário
router.get("/", asyncHandler(async (req, res) => {
  const entries = await prisma.userGame.findMany({
    where: { userId: req.userId },
    include: {
      game: {
        include: {
          genre: true,
          platforms: {
            include: { platform: true }
          }
        }
      }
    },
    orderBy: { addedAt: "desc" }
  });

  res.json(entries);
}));

// Adiciona jogo à biblioteca
router.post("/:gameId", asyncHandler(async (req, res) => {
  const gameId = Number(req.params.gameId);

  if (!Number.isInteger(gameId) || gameId <= 0) {
    return res.status(400).json({
      error: "ID do jogo inválido."
    });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId }
  });

  if (!game) {
    return res.status(404).json({
      error: "Jogo não encontrado."
    });
  }

  const existing = await prisma.userGame.findUnique({
    where: {
      userId_gameId: {
        userId: req.userId,
        gameId
      }
    }
  });

  if (existing) {
    return res.status(409).json({
      error: "Este jogo já está na sua biblioteca."
    });
  }

  const entry = await prisma.userGame.create({
    data: {
      userId: req.userId,
      gameId
    },
    include: { game: true }
  });

  res.status(201).json(entry);
}));

// Remove jogo da biblioteca
router.delete("/:gameId", asyncHandler(async (req, res) => {
  const gameId = Number(req.params.gameId);

  if (!Number.isInteger(gameId) || gameId <= 0) {
    return res.status(400).json({
      error: "ID do jogo inválido."
    });
  }

  const existing = await prisma.userGame.findUnique({
    where: {
      userId_gameId: {
        userId: req.userId,
        gameId
      }
    }
  });

  if (!existing) {
    return res.status(404).json({
      error: "Jogo não está na sua biblioteca."
    });
  }

  await prisma.userGame.delete({
    where: {
      userId_gameId: {
        userId: req.userId,
        gameId
      }
    }
  });

  res.json({
    message: "Jogo removido da sua biblioteca."
  });
}));

export default router;
