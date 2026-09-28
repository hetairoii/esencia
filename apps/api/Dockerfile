# syntax=docker/dockerfile:1

# --- Etapa 1: dependencias + build ---
FROM node:20-alpine AS build
WORKDIR /app

# El motor de consultas de Prisma (linux-musl-openssl-3.0.x, ver prisma/schema.prisma)
# necesita OpenSSL en tiempo de ejecución; node:20-alpine no lo trae por defecto.
RUN apk add --no-cache openssl

# Copiamos primero solo los manifiestos para aprovechar la caché de capas de Docker:
# si package.json no cambia, esta capa (npm ci) no se reconstruye en builds sucesivos.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Etapa 2: imagen final, mínima ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Mismo motivo que en la etapa de build: el motor de Prisma necesita OpenSSL
# en tiempo de ejecución dentro del contenedor (ver prisma/schema.prisma).
RUN apk add --no-cache openssl

# Usuario no root: buena práctica de seguridad para contenedores en producción.
RUN addgroup -S esencia && adduser -S esencia -G esencia

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

COPY --from=build /app/dist ./dist

USER esencia

# El puerto se controla por la variable de entorno PORT (Render la inyecta automáticamente);
# 8080 es el valor por defecto documentado en docs/05-modelos-cloud.md.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
