# Stage 1: Frontend Builder
# This stage prepares the static frontend assets.
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
    && curl -L https://remnawave.github.io/xray-monaco-editor/xray.schema.cn.json -o frontend_temp/dist/xray.schema.cn.json \
    && curl -L https://remnawave.github.io/xray-monaco-editor/main.wasm -o frontend_temp/dist/main.wasm

RUN if [ "$BRANCH" = "dev" ]; then \
    curl -L ${FRONTEND_WITH_CROWDIN} -o frontend-crowdin.zip \
    && unzip frontend-crowdin.zip -d frontend_crowdin_temp \
    && curl -L https://remnawave.github.io/xray-monaco-editor/wasm_exec.js -o frontend_crowdin_temp/dist/wasm_exec.js \
    && curl -L https://remnawave.github.io/xray-monaco-editor/xray.schema.json -o frontend_crowdin_temp/dist/xray.schema.json \
    && curl -L https://remnawave.github.io/xray-monaco-editor/xray.schema.cn.json -o frontend_crowdin_temp/dist/xray.schema.cn.json \
    && curl -L https://remnawave.github.io/xray-monaco-editor/main.wasm -o frontend_crowdin_temp/dist/main.wasm; \
    else \
      mkdir -p frontend_crowdin_temp/dist; \
    fi

# Stage 2: Backend Builder
# This stage installs all dependencies, generates prisma client, and builds the app bundle.
FROM node:22 AS backend-build
WORKDIR /opt/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npx prisma generate

# Copy the rest of the source code
COPY . .

# Run migrations and build the application
RUN npm run migrate:generate
RUN npm run build && node esbuild.config.mjs --build

# This creates a clean, minimal node_modules with only production dependencies
RUN \
  TARGET_BINARY="linux-musl-openssl-3.0.x"; \
  if [ "$TARGETARCH" = "arm64" ]; then \
    TARGET_BINARY="linux-musl-arm64-openssl-3.0.x"; \
  fi \
  && node esbuild.config.mjs --create-deps \
  && PRISMA_CLI_BINARY_TARGETS=$TARGET_BINARY npm install --prefix /opt/app/prod_modules

# Stage 3: Production Image
# This is the final, lean image that will be deployed.
FROM node:22-alpine
WORKDIR /opt/app

ARG BRANCH=main

# Install jemalloc
RUN apk add --no-cache jemalloc curl

ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2
ENV REMNAWAVE_BRANCH=${BRANCH}
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Copy the cleanly installed production modules from the build stage
COPY --from=backend-build /opt/app/prod_modules/node_modules /opt/app/node_modules

# --- Copy Artifacts from Builder Stages ---
# Copy frontend assets
COPY --from=frontend /opt/frontend/frontend_temp/dist ./frontend
COPY --from=frontend /opt/frontend/frontend_crowdin_temp/dist ./frontend-crowdin

# Copy prisma schema (required by the client at runtime)
COPY --from=backend-build /opt/app/prisma/schema.prisma ./prisma/schema.prisma
# Copy the pre-generated prisma client and its engine binary from build node_modules.
COPY --from=backend-build /opt/app/node_modules/.prisma /opt/app/node_modules/.prisma
COPY --from=backend-build /opt/app/node_modules/@remnawave /opt/app/node_modules/@remnawave

# Copy other necessary files
COPY configs /var/lib/remnawave/configs
COPY package*.json ./
COPY libs ./libs

COPY ecosystem.config.js ./
COPY docker-entrypoint.sh ./
COPY esbuild.config.mjs ./

# Copy bundled application code
RUN --mount=type=bind,from=backend-build,source=/opt/app/bundle,target=/opt/app/bundle \
    node esbuild.config.mjs --copy-bundled-executables

# Clean up prisma libraries
RUN \
  if [ "$TARGETARCH" = "arm64" ]; then \
    find /opt/app/node_modules/.prisma -name "libquery_engine-*.so.node" ! -name "*arm64*" -delete; \
  else \
    find /opt/app/node_modules/.prisma -name "libquery_engine-*.so.node" \( -name "*arm64*" -o -name "*debian*" \) -delete; \
  fi && \
  find /opt/app/node_modules/.prisma/client -name "libquery_engine-*.so.node" -exec ln -fs {} /opt/app/node_modules/@prisma/engines/ \;

# Install pm2 globally
RUN npm install pm2 -g --no-fund

ENTRYPOINT [ "/bin/sh", "docker-entrypoint.sh" ]

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]