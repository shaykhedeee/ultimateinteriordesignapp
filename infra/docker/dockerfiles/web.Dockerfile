FROM node:20-alpine
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./

COPY apps ./apps
COPY packages ./packages
COPY services ./services

RUN pnpm install
