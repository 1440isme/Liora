# syntax=docker/dockerfile:1.6

############################
# Build stage
############################
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests dependency:go-offline

# Build
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests clean package

############################
# Runtime stage
############################
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN useradd -r -u 10001 appuser
USER appuser

ENV SERVER_PORT=8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:InitialRAMPercentage=25"

EXPOSE 8080

COPY --from=build /app/target/*.jar /app/app.jar

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -Dserver.port=${PORT:-${SERVER_PORT}} -jar /app/app.jar"]

