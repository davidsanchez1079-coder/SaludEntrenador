# ============================================
# Stage 1: Build con Maven
# ============================================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar pom y descargar dependencias (cache layer)
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true

# Copiar codigo fuente y compilar
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ============================================
# Stage 2: Runtime con JRE
# ============================================
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copiar JAR generado (nombre variable, usar wildcard)
COPY --from=build /app/target/*.jar app.jar

# Railway define PORT como variable de entorno
ENV PORT=8080
EXPOSE 8080

# Ejecutar la aplicacion
ENTRYPOINT ["java", "-jar", "app.jar"]
