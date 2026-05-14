FROM node:20-alpine AS base

# 1. Instalar dependências e construir a aplicação
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./

# Instalar dependências com npm
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# 2. Imagem de produção leve
FROM base AS deploy
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
