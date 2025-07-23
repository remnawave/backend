FROM alpine:3.19 AS frontend
WORKDIR /opt/frontend

ARG BRANCH=main
ARG FRONTEND_URL=https://github.com/remnawave/frontend/releases/latest/download/remnawave-frontend.zip
ARG FRONTEND_WITH_CROWDIN=https://github.com/remnawave/frontend/releases/latest/download/remnawave-frontend.zip

RUN apk add --no-cache curl unzip ca-certificates \
    && curl -L ${FRONTEND_URL} -o frontend.zip \
    && unzip frontend.zip -d frontend_temp \
    && curl -L https://remnawave.github.io/xray-monaco-editor/wasm_exec.js -o frontend_temp/dist/wasm_exec.js \
    && curl -L https://remnawave.github.io/xray-monaco-editor/xray.schema.json -o frontend_temp/dist/xray.schema.json \
    && curl -L https://remnawave.github.io/xray-monaco-editor/main.wasm -o frontend_temp/dist/main.wasm

RUN if [ "$BRANCH" = "dev" ]; then \
    curl -L ${FRONTEND_WITH_CROWDIN} -o frontend-crowdin.zip \
    && unzip frontend-crowdin.zip -d frontend_crowdin_temp \
    && curl -L https://remnawave.github.io/xray-monaco-editor/wasm_exec.js -o frontend_crowdin_temp/dist/wasm_exec.js \
    && curl -L https://remnawave.github.io/xray-monaco-editor/xray.schema.json -o frontend_crowdin_temp/dist/xray.schema.json \
    && curl -L https://remnawave.github.io/xray-monaco-editor/main.wasm -o frontend_crowdin_temp/dist/main.wasm; \
    else \
    mkdir -p frontend_crowdin_temp/dist; \
    fi

FROM node:22 AS backend-build
WORKDIR /opt/app


COPY package*.json ./
COPY prisma ./prisma


RUN npm ci

COPY . .

RUN npm run migrate:generate

RUN npm run build

RUN npm cache clean --force 

RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /opt/app

ARG BRANCH=main

# Install jemalloc
RUN apk add --no-cache jemalloc

ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2
ENV REMNAWAVE_BRANCH=${BRANCH}

COPY --from=backend-build /opt/app/dist ./dist
COPY --from=frontend /opt/frontend/frontend_temp/dist ./frontend
COPY --from=frontend /opt/frontend/frontend_crowdin_temp/dist ./frontend-crowdin
COPY --from=backend-build /opt/app/prisma ./prisma
COPY --from=backend-build /opt/app/node_modules ./node_modules

COPY configs /var/lib/remnawave/configs
COPY package*.json ./
COPY libs ./libs

COPY ecosystem.config.js ./
COPY docker-entrypoint.sh ./

RUN npm install pm2 -g \
    && npm link

CMD [ "/bin/sh", "docker-entrypoint.sh" ]