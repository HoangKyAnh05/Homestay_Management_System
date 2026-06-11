# Homestay Management System
Backend

* Java 21
* Spring Boot 4.0.6
* Spring Security + JWT
* Spring Data JPA + Hibernate
* MySQL 8
* JavaMailSender (Gmail SMTP)
* 
Frontend

* React 19
* Vite 8

Database Status:

* Completed

Entity Status:

* Completed

Architecture Rules:

Controller
→ Service
→ Repository

Never access Repository directly from Controller.

All APIs must use DTO.

Use Global Exception Handler.

Use JWT Authentication.
