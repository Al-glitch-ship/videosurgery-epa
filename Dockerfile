FROM node:20-slim AS builder

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copiar arquivos de dependência
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar dependências (no-frozen-lockfile porque adicionamos novos pacotes)
RUN pnpm install --no-frozen-lockfile

# Copiar código-fonte
COPY . .

# Build do frontend (Vite) e backend (esbuild)
RUN pnpm run build

# --- Estágio de produção ---
FROM node:20-slim AS runner

RUN npm install -g pnpm@10.4.1

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --no-frozen-lockfile --prod

# Copiar build do estágio anterior
COPY --from=builder /app/dist ./dist

# Criar diretório para uploads temporários
RUN mkdir -p /app/uploads/videos

# Porta que o Cloud Run vai usar
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
