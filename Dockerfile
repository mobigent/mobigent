FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/gateway/package.json packages/gateway/package.json
COPY packages/providers/package.json packages/providers/package.json
COPY packages/react-native/package.json packages/react-native/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY examples/agent-server/package.json examples/agent-server/package.json
COPY examples/expense-app/package.json examples/expense-app/package.json
RUN npm ci

FROM deps AS build
COPY . .
# Build only packages needed for the gateway runtime image.
# Dependency order: core → providers → gateway.
RUN npm run build -w @mobigent/core \
  && npm run build -w @mobigent/providers \
  && npm run build -w @mobigent/gateway
RUN npm prune --omit=dev --workspaces

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV MOBIGENT_WS_PORT=8787
ENV MOBIGENT_HTTP_PORT=8788
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
EXPOSE 8787 8788
CMD ["node", "packages/gateway/dist/http-server.js"]
