# Build from the monorepo root:
# docker build -f apps/group/Dockerfile -t insurance-group .
FROM node:22-alpine AS build

WORKDIR /app

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY}

# npm honors the pipeline proxy. Corepack's downloader does not, so it fails
# while fetching https://registry.npmjs.org/pnpm/-/pnpm-10.15.0.tgz.
RUN npm install -g pnpm@10.15.0 \
    && pnpm --version

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/common/package.json ./apps/common/package.json
COPY apps/retail/package.json ./apps/retail/package.json
COPY apps/group/package.json ./apps/group/package.json
COPY packages/routes/package.json ./packages/routes/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/util/package.json ./packages/util/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @insurance-poc/group build

# Serve the built application at /group/.
FROM nginx:alpine

COPY --from=build /app/apps/group/dist /usr/share/nginx/html/group

RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    location = / {' \
    '        return 302 /group/;' \
    '    }' \
    '' \
    '    location = /group {' \
    '        return 301 /group/;' \
    '    }' \
    '' \
    '    location /group/ {' \
    '        try_files $uri $uri/ /group/index.html;' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

RUN nginx -t

EXPOSE 80
