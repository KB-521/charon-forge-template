FROM node:22-alpine AS runner
ARG MODULE_NAME=app
ARG GIT_COMMIT_ID
LABEL git.commit.id=${GIT_COMMIT_ID:-"unknown"}

ENV APP_NAME=${MODULE_NAME} NODE_ENV=production SPRING_PROFILES_ACTIVE=prod PORT=7001
WORKDIR /app
COPY --chown=node:node . ./
RUN mkdir -p /app/log && chown node:node /app/log
USER node
EXPOSE 7001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/check').then((r) => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "dist/main.js"]
