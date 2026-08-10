# QR Booking Cancellation Documentation

## Overview

The My Tickets page supports cancelling an active booking while preserving the newer grouped-booking and QR digital-pass interface.

The implementation does not remove or replace the QR feature. Each booking remains one master card containing one or more scannable passes.

## User Flow

```text
Customer opens My Tickets
        ↓
Active grouped booking card is displayed
        ↓
Customer selects Cancel Booking
        ↓
Angular Material confirmation dialog opens
        ↓
Customer confirms cancellation
        ↓
Frontend calls the backend cancellation API
        ↓
Backend changes the booking to CANCELLED and restores its seats
        ↓
Frontend reloads the booking data
        ↓
Booking moves from Active Reservations to Past Reservations
```

## Backend API

The feature uses the existing backend endpoint:

```http
PATCH /api/bookings/{bookingId}/cancel
```

Example:

```http
PATCH /api/bookings/9/cancel
```

The backend cancellation logic:

- Finds the booking by ID
- Rejects a booking that is already cancelled
- Changes the booking status to `CANCELLED`
- Restores the booked quantity to the seat category's available seats
- Saves the updated booking and seat category

## Files Changed

### Ticket model

File:

```text
src/app/core/models/ticket.model.ts
```

Optional booking fields were added to the UI ticket data:

- `bookingId`
- `bookingStatus`
- `bookingQuantity`
- `totalPrice`

These fields allow individual QR passes to retain information about their parent booking.

### Ticket service

File:

```text
src/app/core/services/ticket.service.ts
```

The existing ticket request and booking request are combined. Ticket records are enriched with their matching booking ID, status, quantity, and total price.

If a booking has no returned ticket records, a temporary pass record is created so its booking card can still be displayed.

The cancellation request expects a plain-text response:

```ts
return this.http.patch(
  `${this.apiUrl}/bookings/${bookingId}/cancel`,
  {},
  { responseType: 'text' }
);
```

Specifying `responseType: 'text'` prevents Angular from trying to parse the backend's success message as JSON.

### My Tickets component

Files:

```text
src/app/features/portals/customer/my-tickets/my-tickets.ts
src/app/features/portals/customer/my-tickets/my-tickets.html
src/app/features/portals/customer/my-tickets/my-tickets.css
```

The grouped-booking structure now stores the real `bookingId`. Its grouping key prefers that ID so separate bookings are not combined accidentally.

The component also contains:

- `cancellingBookingId` loading state
- `cancellationMessage` success feedback
- `cancelBooking()` method
- Angular Material confirmation dialog
- Error feedback

The Cancel Booking button is displayed only when an active card has a valid booking ID.

After cancellation succeeds, `loadTickets()` runs again. Reloading from the backend ensures that the interface displays the saved database state rather than relying only on a temporary frontend change.

## Angular Material Components

The cancellation interaction uses:

- Material stroked button
- Material icons
- Material dialog
- Existing shared `ConfirmDialogComponent`

No external interface library was added for the cancellation feature.

## QR Feature Compatibility

The following QR functionality remains unchanged:

- QR preview on active booking cards
- View Gate Pass button
- View All Passes button for multiple tickets
- Digital-pass modal
- Previous and next pass navigation
- Individual QR code for every pass
- Past reservation history

The Cancel Booking button is added below the QR pass action on active booking cards.

## How to Test

1. Start PostgreSQL and the Spring Boot backend.
2. Start the Angular frontend with `npm start`.
3. Log in as a customer.
4. Create a booking containing one or more tickets.
5. Open `/my-tickets`.
6. Confirm that one grouped booking card contains all of its QR passes.
7. Select **Cancel Booking**.
8. Select **Keep Booking** and confirm that nothing changes.
9. Select **Cancel Booking** again and confirm the cancellation.
10. Confirm that a success message appears.
11. Confirm that the booking moves to Past Reservations with `CANCELLED` status.
12. Refresh the browser and confirm that the cancelled status remains.
13. Confirm through the backend or database that the correct number of seats was restored.

The browser Network panel should show a request similar to:

```http
PATCH http://localhost:8080/api/bookings/9/cancel
```

## Error Handling

The page displays an error message when:

- The booking cannot be found
- The booking is already cancelled
- Authentication is missing or expired
- The backend is unavailable
- Another server error prevents cancellation

The Cancel Booking button is disabled while its request is running to reduce accidental repeated requests.

## Current Limitation

The frontend matches ticket records to booking records using event title, seat category, and booking timestamp because the current ticket API response does not directly include `bookingId`.

A future backend improvement should add `bookingId`, booking status, quantity, and total price directly to each returned ticket DTO. The frontend could then remove the temporary matching logic.

## Completion Summary

The customer can now cancel an active booking from the current QR-ticket interface. The application confirms the action, calls the existing backend API, displays success or failure feedback, reloads the saved data, and moves the cancelled booking into the Past Reservations section without removing the QR digital-pass functionality.
