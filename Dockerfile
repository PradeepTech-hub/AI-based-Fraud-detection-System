# Multi-stage build for Spring Boot app
FROM maven:3.9.0-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD sh -c "code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/dashboard/stats || echo 000); [ \"$code\" != \"000\" ]"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]