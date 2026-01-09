# 1. ビルド環境（Java 21対応のMaven環境）
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# 2. 実行環境（Java 21対応の軽量環境）
FROM eclipse-temurin:21-jdk-jammy
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]