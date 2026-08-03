# Sprint Documentation: Frontend Core Architecture & Authentication

**Author:** Omar  
**Project:** Cinema Ticketing Platform  
**Document:** `Omar's_Task_1.md`  

---

## Overview

This documentation file provides a comprehensive summary of the initial frontend setup and foundational features developed for the **Cinema Ticketing Platform**. The focus of this sprint was to establish a modern, scalable Angular architecture, implement a cinematic dark-themed global layout, build reactive authentication pages exclusively using pure Angular Signal Forms, and configure lazy-loaded routing for optimal web performance.

---

## Work Flow & Architecture Strategy

To maintain high code quality, developer velocity, and seamless team collaboration, the project follows three strategic technical principles:

1. **Pure Standalone Component Architecture (Zero `NgModule` Usage):**  
   Every component, directive, and pipe in the codebase is built strictly using Angular Standalone Components. Eliminating traditional `NgModule` files removes module boilerplate and prevents git merge conflicts across team branches.

2. **Lazy Loading by Default:**  
   To optimize initial page load performance and minimize the main JavaScript bundle size, lazy loading is enforced from day one using `loadComponent()` for all feature routes.

3. **Pure Signal Forms & Reactive State:**  
   Form inputs, user interaction states, and validation logic exclusively leverage Angular Signals (`signal()` and `computed()`), removing legacy `NgModule` / `ReactiveFormsModule` control boilerplate in favor of pure reactive signals.

---

## Changes Implemented

### 1. Workflow & Architecture Strategy
* **Standalone Architecture Enforcement:** Enforced 100% Standalone Component usage across the application with zero `NgModule` imports to simplify dependency trees and prevent merge conflicts.
* **Modular Directory Structure:** Organized feature domains into clean subfolders (`features/auth`, `features/public`, `features/portals`, `shared`, `core`) for high maintainability.
* **Lazy Loading Strategy:** Set up performance-focused lazy loading for feature components, ensuring code splitting happens automatically per route.

### 2. Global Layout & Styling
* **Viewport Layout Skeleton:**
  * **Top Navbar:** Persistent fixed header component (`Navbar`) at the top of the screen.
  * **Central Viewport (`router-outlet`):** Responsive router container expanding to fill all available viewport height.
  * **Bottom Footer:** Sticky footer component (`Footer`) pushed neatly to the bottom of the viewport.
* **Global Dark Cinematic Theme:** Styled global CSS custom properties (`src/styles.css` & `src/app/app.css`) to enforce a dark cinematic backdrop suited for cinema ticketing.
* **"Baby Blue" Accent Palette:** Configured action buttons, active navigation states, and focus rings with a vibrant "baby blue" primary accent color.
* **Angular Material Contrast Overrides:** Overrode default Angular Material input styles to guarantee all form input text, labels, and icons render in crisp, high-contrast pure white (`#ffffff`) against dark container backgrounds.

### 3. Authentication Pages
* **Standalone Login & Register Components:** Built dedicated `Login` and `Register` feature components under `src/app/features/auth/`.
* **Pure Angular Signal Forms:** Exclusively used Angular Signals (`signal()`) and Computed Signals (`computed()`) for managing form model state, touched states, and reactive validation:
  * **Required Field Validations:** Derived via computed signals (`emailEmpty`, `passwordEmpty`, `fullNameEmpty`, `confirmPasswordEmpty`).
  * **Email Format Verification:** Derived via regex matching inside a computed signal (`emailInvalid`).
  * **Password Criteria & Matching:** Built computed signals for minimum password length (`passwordTooShort`) and cross-field confirmation verification (`passwordMismatch`).
  * **Overall Form Validity:** Aggregated into a unified `isFormValid` computed signal for submit button state and execution guards.
* **Default Customer Role Payload:** Hardcoded the user registration payload to automatically default all new accounts to the `'CUSTOMER'` role.

### 4. Routing Configuration
* **Lazy-Loaded Route Definitions (`app.routes.ts`):** Configured feature route paths (`''`, `'login'`, `'register'`, `'my-tickets'`) utilizing `loadComponent` for dynamic imports.
* **Clean Fallback Handling:** Implemented a wildcard catch-all route (`**`) configured with `redirectTo: ''` and `pathMatch: 'full'` to handle invalid URLs cleanly by redirecting to the home page.

---

## Technologies & Tools Used

| Technology / Tool | Category | Description & Role in Project |
| :--- | :--- | :--- |
| **Angular 22** | Framework | Core web framework running with Standalone Components |
| **Angular Signals** | State & Forms | `signal()` and `computed()` managing form inputs, validation, and UI state |
| **Angular Router** | Navigation | Lazy loading via `loadComponent()` and wildcard fallback handling |
| **Angular Material / CDK** | UI Components | MatCard, MatFormField, MatInput, MatButton, and MatIcon with dark theme overrides |
| **TypeScript 6.0** | Language | Type-safe development across components, routing, and signal models |
| **Vanilla CSS3** | Styling | Flexbox viewport layout, CSS custom properties, and Material theme overrides | 
