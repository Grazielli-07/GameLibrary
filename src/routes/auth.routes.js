
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import auth from "../middlewares/auth.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Informe name, email e password."
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      error: "A senha deve ter pelo menos 8 caracteres."
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = String(name).trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    return res.status(409).json({
      error: "E-mail já cadastrado."
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  return res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user
  });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Informe email e password."
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      error: "E-mail ou senha inválidos."
    });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login realizado com sucesso.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
}));

router.get("/me", auth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado."
    });
  }

  return res.json(user);
}));

export default router;
