import { z } from "zod";

const email = z
  .string({ required_error: "El email es obligatorio" })
  .trim()
  .toLowerCase()
  .email("Email inválido")
  .max(254, "Email demasiado largo");

/** Fecha de nacimiento en formato ISO `YYYY-MM-DD`, interpretada en UTC. */
const birthDate = z
  .string({ required_error: "La fecha de nacimiento es obligatoria" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD")
  .transform((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha inválida" });
      return z.NEVER;
    }
    if (date.getUTCFullYear() < 1900 || date.getTime() > Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha fuera de rango" });
      return z.NEVER;
    }
    return date;
  });

export const registerSchema = z.object({
  email,
  // 72 es el límite práctico de bcrypt; se mantiene como tope razonable para evitar abuso.
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar 72 caracteres")
    .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra")
    .regex(/\d/, "La contraseña debe incluir al menos un número"),
  birthDate,
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "La contraseña es obligatoria" }).min(1, "La contraseña es obligatoria"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
