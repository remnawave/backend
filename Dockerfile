FROM alpine:3.19 AS frontend
WORKDIR /opt/frontend

ARG BRANCH=main
ARG FRONTEND_URL=https://github.com/remnawave/frontend/releases/latest/download/remnawave-frontend.zip

RUN apk add --no-cache curl unzip ca-certificates \
    && curl -L ${FRONTEND_URL} -o frontend.zip \
    && unzip frontend.zip -d frontend_temp \
    && curl -L https://validator.remna.dev/wasm_exec.js -o frontend_temp/dist/assets/wasm_exec.js \
    && curl -L https://validator.remna.dev/xray.schema.json -o frontend_temp/dist/assets/xray.schema.json \
    && curl -L https://validator.remna.dev/xray.schema.cn.json -o frontend_temp/dist/assets/xray.schema.cn.json \
    && curl -L https://validator.remna.dev/main.wasm -o frontend_temp/dist/assets/main.wasm

FROM node:24.13-alpine AS backend-build
WORKDIR /opt/app

# RUN apk add python3 python3-dev build-base pkgconfig libunwind-dev

ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x,linux-musl-arm64-openssl-3.0.x

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY patches ./patches


RUN npm ci

COPY . .

RUN npm run migrate:generate

RUN npm run build

RUN npm cache clean --force 

RUN npm prune --omit=dev

FROM node:24.13-alpine
WORKDIR /opt/app

ARG BRANCH=main

ARG __RW_METADATA_VERSION=1.1.1
ARG __RW_METADATA_GIT_BACKEND_COMMIT=0f344f388807f5323b49024a563b3f8146d66857
ARG __RW_METADATA_GIT_FRONTEND_COMMIT=0f344f388807f5323b49024a563b3f8146d66857
ARG __RW_METADATA_GIT_BRANCH=dev
ARG __RW_METADATA_BUILD_TIME=2011-11-11T11:11:11Z
ARG __RW_METADATA_BUILD_NUMBER=0

# Install jemalloc
# RUN apk add --no-cache jemalloc
# ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2
# libunwind
# Install mimalloc
RUN apk add --no-cache mimalloc curl
ENV LD_PRELOAD=/usr/lib/libmimalloc.so

ENV REMNAWAVE_BRANCH=${BRANCH}
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

ENV PM2_DISABLE_VERSION_CHECK=true
ENV NODE_OPTIONS="--max-old-space-size=16384"

ENV __RW_METADATA_VERSION=${__RW_METADATA_VERSION}
ENV __RW_METADATA_GIT_BACKEND_COMMIT=${__RW_METADATA_GIT_BACKEND_COMMIT}
ENV __RW_METADATA_GIT_FRONTEND_COMMIT=${__RW_METADATA_GIT_FRONTEND_COMMIT}
ENV __RW_METADATA_GIT_BRANCH=${__RW_METADATA_GIT_BRANCH}
ENV __RW_METADATA_BUILD_TIME=${__RW_METADATA_BUILD_TIME}
ENV __RW_METADATA_BUILD_NUMBER=${__RW_METADATA_BUILD_NUMBER}

COPY --from=backend-build /opt/app/dist ./dist
COPY --from=frontend /opt/frontend/frontend_temp/dist ./frontend
COPY --from=backend-build /opt/app/prisma ./prisma
COPY --from=backend-build /opt/app/patches ./patches
COPY --from=backend-build /opt/app/node_modules ./node_modules

COPY configs /var/lib/remnawave/configs
COPY package*.json ./
COPY prisma.config.ts ./prisma.config.ts
COPY libs ./libs

COPY ecosystem.config.js ./
COPY docker-entrypoint.sh ./

RUN npm install pm2 -g \
    && npm link


ENTRYPOINT [ "/bin/sh", "docker-entrypoint.sh" ]

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]