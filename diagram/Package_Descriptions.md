# Package Descriptions - Backend & Frontend

This document provides detailed descriptions of the roles and responsibilities of each package/folder within the Homestay Management System codebase, covering both the **Backend (Spring Boot)** and **Frontend (React)** projects.

---

## 1. Backend (Spring Boot) - Package Descriptions

| No | Package | Description |
| :--- | :--- | :--- |
| **01** | `config` | Contains application configuration classes, including CORS policy configuration, Jackson JSON serialization settings, password encoding beans, JavaMailSender configurations, and other general spring bean configurations. |
| **02** | `security` | Handles application authentication and authorization. Contains the custom JWT filter (`JwtAuthenticationFilter`), Spring Security configurations (`SecurityConfig`), and user details service (`CustomUserDetails`). |
| **03** | `controller` | The Presentation Layer (REST Controllers). Receives HTTP REST API requests from the React client (e.g., `AuthController`, `RoomController`, `BookingController`), performs input validation, and delegates execution to the Service Layer. |
| **04** | `dto` | Contains Data Transfer Objects (DTOs) divided into `request` (incoming API request payloads) and `response` (outgoing API responses). Decouples database entities from clients to ensure security and efficient data payload transmission. |
| **05** | `service` | The Business Logic Layer, containing service interfaces and concrete implementations under `service.impl`. Handles core business logic such as booking verification, room availability checks, pricing calculations, and OTP email dispatch. |
| **06** | `repository` | The Data Access Layer. Contains interfaces extending Spring Data JPA's `JpaRepository` (e.g., `AccountRepository`, `RoomRepository`, `BookingRepository`) to perform automated CRUD operations and database queries against MySQL via Hibernate. |
| **07** | `entity` | The Domain Entity Layer. Contains Java classes mapped directly to MySQL database tables (e.g., `Account`, `Room`, `Booking`, `Invoice`, `Voucher`, `Role`) using JPA `@Entity` annotations. |

---

## 2. Frontend (React + Vite) - Package Descriptions

| No | Package | Description |
| :--- | :--- | :--- |
| **01** | `assets` | Stores static assets for the application, including images, brand logos, SVG/PNG icons, and the global stylesheet (`index.css`) applied across the application. |
| **02** | `utils` | Contains reusable utility helper functions, such as currency formatters (VND/USD), date/time parsers for booking forms, and form validation helpers. |
| **03** | `services` | The API integration layer. Contains service functions (e.g., `authService.js`, `roomService.js`) using Axios/Fetch to send HTTP requests to the backend API and manage browser-side JWT token storage. |
| **04** | `components` | Contains small, independent, and reusable UI components shared across different views, such as buttons (`Button`), input textboxes (`Input`), modal alerts (`Modal`), card items (`Card`), Navbar, and Footer. |
| **05** | `pages` | Contains page-level components corresponding to the main routes of the application: `Home`, `Rooms`, `Login`/`Register`, `Profile`, `BookingHistory`, `ForgotPassword`, and the `Admin` portal. |
| **06** | `Root (App/Main)` | The entry point of the React application. `main.jsx` renders the root React node into the browser DOM; `App.jsx` configures page routing (React Router) and wraps application context providers (e.g., AuthContext, ToastContext). |
