FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY grants/package*.json grants/
COPY grants-backend/package*.json grants-backend/
COPY my-bot/package*.json my-bot/
RUN npm --prefix grants ci && npm --prefix grants-backend ci && npm --prefix my-bot ci --omit=dev
COPY grants/ grants/
COPY grants-backend/ grants-backend/
COPY my-bot/ my-bot/
RUN npm --prefix grants run build && npm --prefix grants-backend run build && npm --prefix grants-backend prune --omit=dev
RUN curl --fail --location https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer -o /app/max-root.pem \
    && openssl x509 -in /app/max-root.pem -outform DER -out /tmp/max-root.der \
    && echo 'd26d2d0231b7c39f92cc738512ba54103519e4405d68b5bd703e9788ca8ecf31  /tmp/max-root.der' | sha256sum -c -

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production NODE_EXTRA_CA_CERTS=/app/max-root.pem
WORKDIR /app
COPY --from=build /app/max-root.pem /app/max-root.pem

FROM runtime AS api
COPY --from=build /app/grants/dist /app/grants/dist
COPY --from=build /app/grants-backend/dist /app/grants-backend/dist
COPY --from=build /app/grants-backend/node_modules /app/grants-backend/node_modules
COPY --from=build /app/grants-backend/package.json /app/grants-backend/package.json
COPY --from=build /app/grants-backend/data/grants.seed.json /app/grants-backend/data/grants.seed.json
RUN mkdir -p /app/storage && chown node:node /app/storage
USER node
EXPOSE 4000
CMD ["node", "grants-backend/dist/server.js"]

FROM runtime AS bot
COPY --from=build /app/my-bot /app/my-bot
USER node
CMD ["node", "my-bot/src/index.js"]
