# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build

# ---- serve ----
FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 80
# -s：SPA 模式，所有路徑都回 index.html，讓 vue-router 的 history mode 正常運作
CMD ["serve", "-s", "dist", "-l", "80"]
