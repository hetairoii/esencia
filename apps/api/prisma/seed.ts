import { PrismaClient } from "@prisma/client";

/**
 * Catálogo inicial de preguntas guiadas e intereses.
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros
 * (los prompts se identifican por su texto; los intereses por su nombre único).
 */
const prisma = new PrismaClient();

const PROMPTS = [
  "Una conversación de la que podría hablar horas es…",
  "Lo que más valoro en una persona es…",
  "Mi idea de un domingo perfecto es…",
  "Algo que me cambió la forma de ver la vida fue…",
  "Estoy aprendiendo a…",
  "Una pequeña costumbre mía que me hace feliz es…",
  "Lo que busco en una relación es…",
  "Me siento más yo mismo/a cuando…",
  "Una opinión impopular que defiendo es…",
  "El mejor consejo que me han dado fue…",
  "Un libro, película o canción que cuenta quién soy es…",
  "Para mí, una buena primera conversación es aquella en la que…",
];

const INTERESTS = [
  "Lectura",
  "Cine",
  "Música",
  "Viajes",
  "Cocina",
  "Senderismo",
  "Deporte",
  "Fotografía",
  "Videojuegos",
  "Escritura",
  "Arte",
  "Tecnología",
  "Naturaleza",
  "Mascotas",
  "Voluntariado",
  "Café",
  "Baile",
  "Idiomas",
  "Meditación",
  "Teatro",
];

async function main() {
  for (const text of PROMPTS) {
    const existing = await prisma.prompt.findFirst({ where: { text } });
    if (!existing) await prisma.prompt.create({ data: { text } });
  }
  for (const name of INTERESTS) {
    await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
  }
  // eslint-disable-next-line no-console
  console.log(`Seed completado: ${PROMPTS.length} prompts, ${INTERESTS.length} intereses.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
