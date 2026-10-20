FROM eclipse-temurin:8-jre
ARG MODULE=__PROJECT_NAME__-web
ARG GIT_COMMIT_ID=unknown
LABEL git.commit.id=${GIT_COMMIT_ID}
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=7001 \
    LOG_DIR=/app/logs \
    JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
WORKDIR /app
RUN mkdir -p /app/logs && chown -R 10001:10001 /app
COPY --chown=10001:10001 ${MODULE}/target/${MODULE}.jar /app/app.jar
COPY --chown=10001:10001 docker-config/entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh
USER 10001:10001
EXPOSE 7001
ENTRYPOINT ["/app/entrypoint.sh"]
