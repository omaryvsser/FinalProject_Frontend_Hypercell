# 🧪 End-to-End (E2E) Integration Testing Plan & Quality Assurance Guide
**Project:** Cinema Ticketing Platform (Angular 19 Frontend + Spring Boot 3 & PostgreSQL Backend)  
**Author:** Senior QA Automation Engineer & Full-Stack Architect  
**Date:** August 2026  

---

## 📌 Executive Summary
This document provides a comprehensive, step-by-step End-to-End (E2E) integration testing checklist and audit strategy for the Cinema Ticketing Platform. It verifies full stack integration across authentication, seat-category booking, concurrency controls, organizer/admin portals, and HTTP network telemetry.

---

## 📋 Checklist Index
1. [Authentication & Role-Based Access Control (RBAC)](#1-authentication--role-based-access-control-rbac)
2. [The Booking Lifecycle (Critical Path)](#2-the-booking-lifecycle-critical-path)
3. [Concurrency & Race Condition Verification](#3-concurrency--race-condition-verification)
4. [Organizer & Admin Portal Lifecycles](#4-organizer--admin-portal-lifecycles)
5. [Browser Network & DevTools Telemetry Audit](#5-browser-network--devtools-telemetry-audit)
6. [Troubleshooting Guide: Top 3 Integration Failure Modes](#6-troubleshooting-guide-top-3-integration-failure-modes)

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Step # | Test Objective | Action / Input | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **User Registration** | Navigate to `/register`. Fill in Name, unique Email (`qa_cust@test.com`), Password (`Password123!`). Click "Create Account". | Frontend POSTs to `/api/v1/auth/register`. Backend returns `200 OK` with `{ token: "..." }`. App redirects to `/login` or logs user in. | `[ ]` |
| **1.2** | **User Login & Token Storage** | Navigate to `/login`. Enter `qa_cust@test.com` and `Password123!`. Click "Sign In". | Backend returns `200 OK` with JWT. `localStorage.getItem('jwt_token')` is set. App routes to `/discover`. | `[ ]` |
| **1.3** | **HTTP Interceptor Injection** | Open DevTools Network tab. Perform any request (e.g. `POST /api/bookings`). | Request headers contain `Authorization: Bearer eyJhbGci...`. `/api/public/**` routes do NOT attach the header. | `[ ]` |
| **1.4** | **Unauthenticated Route Blocking** | Clear `localStorage` (logout). Manually navigate to `http://localhost:4200/my-tickets` or `/booking/1`. | `authGuard` intercepts request and redirects browser to `/login?returnUrl=/booking/1`. | `[ ]` |
| **1.5** | **Role-Based Guard (Customer -> Admin)** | Log in as Customer (`ROLE_CUSTOMER`). Attempt to access `http://localhost:4200/admin` or `/organizer`. | `roleGuard` evaluates token claims. Access is denied; app redirects user to `/discover` or `/404`. | `[ ]` |
| **1.6** | **Role-Based Guard (Organizer -> Organizer)** | Log in as Organizer (`ROLE_ORGANIZER`). Navigate to `/organizer`. | `roleGuard` grants access. Organizer dashboard loads successfully with management UI. | `[ ]` |

---

## 2. The Booking Lifecycle (Critical Path)

| Step # | Test Objective | Action / Input | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Public Event Discovery** | Navigate to `/discover`. Test search input, category filter tags, and pagination buttons. | GET `/api/public/events` executes. Event cards update dynamically without page reloads. | `[ ]` |
| **2.2** | **Event Details & Category Fetch** | Click an event card. Verify redirection to `/booking/:id`. | GET `/api/public/events/:id` fetches event details including `seatCategories` array (e.g., VIP, IMAX, Standard). | `[ ]` |
| **2.3** | **Dynamic Price & Category State** | Select "IMAX" category (180 EGP). Click `+` quantity counter to increment to 3. | Angular computed signal `totalPrice()` updates in real-time to `540 EGP`. Submit button displays `Confirm Booking (540 EGP)`. | `[ ]` |
| **2.4** | **Booking Submission (`POST`)** | Fill out form (Name, Email, Phone). Click "Confirm Booking". | Button enters loading state (`isSubmitting = true`, spinner shown). `POST /api/bookings` is sent with `{ eventId, userId, seatCategoryId, quantity }`. | `[ ]` |
| **2.5** | **Navigation & Success Banner** | Backend returns `200 OK` with `BookingResponse`. | App routes to `/my-tickets?confirmed=true`. Green notification banner "Booking Confirmed!" is displayed. | `[ ]` |
| **2.6** | **Database Seat Deduction & Ticket Sync** | Inspect "My Tickets" list and re-fetch `/api/public/events/:id`. | Ticket card appears under "Upcoming". The `availableSeats` for the selected seat category in the database is reduced by the booked quantity. | `[ ]` |

---

## 3. Concurrency & Race Condition Verification

> [!IMPORTANT]
> **Capston Grading Requirement:** The platform must prevent overbooking when two users attempt to reserve the final available seat at the exact same millisecond.

### 🧪 Concurrency Test Execution Protocol:
1. **Setup**: Edit an event seat category (e.g., `VIP`) to have exactly **1 available seat** (`availableSeats = 1`).
2. **Execution**: Open two separate terminal windows or run a parallel curl script using background processes:
   ```bash
   # User A Request
   curl -i -X POST http://localhost:8080/api/bookings \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN_USER_A" \
     -d '{"eventId":1, "userId":10, "seatCategoryId":1, "quantity":1}' &

   # User B Request (Simultaneous)
   curl -i -X POST http://localhost:8080/api/bookings \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN_USER_B" \
     -d '{"eventId":1, "userId":11, "seatCategoryId":1, "quantity":1}' &
   wait
   ```

### 🎯 Expected Concurrency Behavior:
- **Winning Request**: Returns `200 OK` with `BookingResponse`. `availableSeats` becomes `0`.
- **Losing Request**: Returns `409 Conflict` or `400 Bad Request` with message: `"Not enough available seats in this category."`
- **Frontend UI Handling**: The losing user's frontend catches the HTTP error gracefully, resets `isSubmitting = false`, and renders an alert banner: `❌ Not enough available seats in this category.` (The Angular app does **NOT** crash or freeze).

---

## 4. Organizer & Admin Portal Lifecycles

| Step # | Test Objective | Action / Input | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Organizer Event Creation** | Log in as Organizer. Go to `/organizer/movies/new`. Fill form, upload poster image (`POST /api/v1/files/upload`), and click Save. | Event POSTs to `/api/v1/events`. Backend stores event and links uploaded file URL. Event appears in Organizer dashboard. | `[ ]` |
| **4.2** | **Organizer Data Isolation** | Log in as `Organizer A`. View event list. Log in as `Organizer B`. View event list. | `Organizer A` only sees events created by `Organizer A`. `Organizer B` cannot view or edit `Organizer A`'s events. | `[ ]` |
| **4.3** | **Admin Platform Management** | Log in as Admin (`ROLE_ADMIN`). Navigate to `/admin`. | Admin can view all system users (`GET /api/admin/users`), change user roles (`PUT /api/admin/users/:id/role`), and manage venues (`/api/venues`). | `[ ]` |
| **4.4** | **Admin Venue Operations** | In Admin portal, create a new venue (`POST /api/venues`) and edit an existing one (`PUT /api/venues/:id`). | Backend processes requests with `200 OK` / `201 Created`. Venue list signal updates in real-time. | `[ ]` |

---

## 5. Browser Network & DevTools Telemetry Audit

During manual testing, open Chrome/Firefox DevTools (`F12`) and verify the following telemetry indicators:

### 📡 Network Tab Verification Checklist:
1. **Headers**:
   - `Request URL`: Must match backend API URL (`http://localhost:8080/api/...`).
   - `Authorization`: Must be `Bearer <jwt_token>` for protected endpoints.
   - `Content-Type`: Must be `application/json` (or `multipart/form-data` for file uploads).
2. **Payload Inspection**:
   - Verify request keys match Java DTO field names exactly (e.g. `seatCategoryId`, `eventId`, `userId`, `quantity`).
3. **HTTP Status Codes**:
   - `200 OK` / `201 Created`: Successful query or mutation.
   - `401 Unauthorized`: Token missing or expired.
   - `403 Forbidden`: Authenticated user lacks required role (`ROLE_*`).
   - `409 Conflict`: Business validation error (e.g. email duplicate or seat capacity exceeded).

### 💻 Console Tab Verification Checklist:
- **Zero Uncaught Exceptions**: No `TypeError: Cannot read properties of undefined`.
- **Clean RxJS Observables**: All error callbacks (`error: (err) => ...`) must catch HttpErrorResponse and handle state via Angular Signals.
- **No CORS Warnings**: No red `Access to XMLHttpRequest at ... from origin 'http://localhost:4200' has been blocked by CORS policy` logs.

---

## 6. Troubleshooting Guide: Top 3 Integration Failure Modes

### 🔴 Failure Mode 1: CORS Policy Error (`Access-Control-Allow-Origin`)
- **Symptom**: Browser console displays: `Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:4200' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`.
- **Root Cause**: Spring Boot backend security filter chain is rejecting requests originating from Angular's dev server (`http://localhost:4200`).
- **Resolution**:
  1. Add a `@CrossOrigin(origins = "http://localhost:4200")` annotation to your Spring Boot REST Controllers.
  2. Configure global CORS in `SecurityConfig.java`:
     ```java
     @Bean
     public CorsConfigurationSource corsConfigurationSource() {
         CorsConfiguration configuration = new CorsConfiguration();
         configuration.setAllowedOrigins(List.of("http://localhost:4200"));
         configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
         configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
         configuration.setAllowCredentials(true);
         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
         source.registerCorsConfiguration("/**", configuration);
         return source;
     }
     ```

---

### 🔴 Failure Mode 2: `401 Unauthorized` / `403 Forbidden` on Protected Endpoints
- **Symptom**: Requests to `/api/bookings` or `/api/tickets/user/:id` fail with HTTP 401 or 403, causing the frontend to redirect to `/login`.
- **Root Cause**: 
  - Token is missing from `localStorage`.
  - Angular `authInterceptor` is missing the `Bearer ` string prefix.
  - Spring Security `WHITE_LIST_URLS` in `SecurityConfig.java` is improperly matching endpoint URL patterns (e.g. `/api/events` vs `/api/public/events`).
- **Resolution**:
  1. Inspect `auth.interceptor.ts` to ensure headers are set correctly:
     ```typescript
     const authReq = (token && !isPublicEndpoint)
       ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
       : req;
     ```
  2. Verify JWT claim parser in `AuthService.ts` correctly extracts `id` / `userId`.

---

### 🔴 Failure Mode 3: `400 Bad Request` JSON Deserialization / Mapping Errors
- **Symptom**: Frontend sends a POST request, but Spring Boot returns HTTP 400 with `JSON parse error` or `Field error in object 'createRequest'`.
- **Root Cause**: DTO field name or type mismatch between TypeScript interfaces and Java DTO classes (e.g., sending `seat_category_id` instead of `seatCategoryId`, or passing a string for a numeric ID).
- **Resolution**:
  1. Check Spring Boot console logs for `HttpMessageNotReadableException` or `MethodArgumentNotValidException`.
  2. Align Angular TypeScript interfaces with Java `@RequestBody` DTOs:
     ```typescript
     // Angular BookingCreateRequest
     export interface BookingCreateRequest {
       eventId: number;
       userId: number;
       seatCategoryId: number;
       quantity: number;
     }
     ```
     ```java
     // Spring Boot BookingDto.CreateRequest
     public record CreateRequest(
         @NotNull Long eventId,
         @NotNull Long userId,
         @NotNull Long seatCategoryId,
         @Min(1) Integer quantity
     ) {}
     ```
