#!/bin/bash
# Load bien moi truong tu file .env roi chay Spring Boot
set -a
source .env
set +a
./mvnw spring-boot:run
