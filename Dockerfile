FROM node:18-alpine
WORKDIR /app

# instalar dependências de produção
COPY package*.json ./
RUN npm ci --only=production --silent

# copiar código
COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]
