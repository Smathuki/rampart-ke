# rampart-ke hosted redaction API + landing page.
# Build from the repo root:  docker build -f server/Dockerfile -t rampart-ke .
# Run:                        docker run -p 8787:8787 rampart-ke
FROM node:22-slim

WORKDIR /app

# Install deps first for layer caching (runs onnxruntime-node postinstall).
COPY package.json package-lock.json ./
RUN npm ci

# Build the library (dist/) that the server imports.
COPY . .
RUN npm run build

ENV PORT=8787
EXPOSE 8787

# Deploy this INSIDE your own infrastructure / a Kenyan data centre so citizen
# data never leaves the country.
CMD ["node", "server/index.mjs"]
