# ⚡ Phase 4: State Management Deep-Dive (Angular Signals)

## 🎯 Overview
This document provides a comprehensive technical deep-dive into how **Angular Signals** (`signal`, `computed`) are utilized across the CinemaTicketing frontend for reactive state management, form validation, digital pass modal rendering, booking cancellation refetches, and optimistic UI updates.

---

### 💡 High-Level Analogy: The Automated Cinema Scoreboard
* **Legacy RxJS (`BehaviorSubject` / `Pipe`):** Like a manual scoreboard where every time a score changes, you have to write code to notify every speaker in the stadium, check if they are still listening, manually subscribe, unsubscribe when leaving, and pipe data streams through multiple filters.
* **Angular Signals:** Like a smart digital scoreboard connected directly to every light bulb. When the score changes (`signal.set()`), only the exact bulbs that display the number light up automatically. No manual subscriptions, no memory leaks, no unsubscriptions required.

---

## 1. Fundamentals of Signals vs. RxJS

| Feature | Legacy RxJS (`BehaviorSubject`) | Angular Signals (`signal()`) |
| :--- | :--- | :--- |
| **Read Syntax** | `subject$.getValue()` or `subject$ \| async` | `mySignal()` (getter call) |
| **Write Syntax** | `subject$.next(newValue)` | `mySignal.set(newValue)` or `mySignal.update(fn)` |
| **Derived State** | `combineLatest([...]).pipe(map(...))` | `computed(() => ...)` |
| **Memory Management** | Requires manual `.unsubscribe()` / `takeUntil` | Automatic lifetime tied to component context |
| **Change Detection** | Zone.js dirty checking entire component tree | Fine-grained reactive DOM node updates |

---

## 2. Core Signal Primitives in CinemaTicketing

### A. Writable Signals (`signal`)
Used to hold local component state (form values, loading flags, raw data streams, modal states):

```typescript
// BookingPage.ts
readonly quantity = signal<number>(1);
readonly selectedCategory = signal<SeatCategory | null>(null);
readonly isSubmitting = signal<boolean>(false);
readonly bookingError = signal<string | null>(null);

// MyTickets.ts
readonly rawTickets = signal<TicketDto[]>([]);
readonly isLoading = signal<boolean>(true);
readonly cancellingBookingId = signal<number | null>(null);
readonly cancellationMessage = signal<string | null>(null);
readonly selectedBookingForModal = signal<GroupedBooking | null>(null);
readonly activePassIndex = signal<number>(0);
```

#### Updating Writable Signals:
```typescript
// Direct value replacement
this.quantity.set(3);
this.cancellingBookingId.set(bookingId);

// Functional mutation based on prior state
this.quantity.update((prev) => Math.max(1, prev - 1));
this.activePassIndex.update((idx) => idx + 1);
```

---

### B. Computed Signals (`computed`)
Pure reactive read-only signals that derive their value from one or more dependency signals. They feature **automatic dependency tracking** and **lazy evaluation with memoization** (only recalculate when a dependency changes):

```typescript
// 1. Calculating dynamic booking price in BookingPage.ts
readonly totalPrice = computed(() => {
  const cat = this.selectedCategory();
  return cat ? cat.price * this.quantity() : 0;
});

// 2. Dynamic seat availability status
readonly isSoldOut = computed(() => {
  const cat = this.selectedCategory();
  return cat ? cat.availableSeats === 0 : false;
});

// 3. Aggregating raw ticket DTOs into Master Bookings in MyTickets.ts
readonly groupedBookings = computed(() => groupTicketDtos(this.rawTickets()));

// 4. Reactive filter for Active vs Past Bookings
readonly activeBookings = computed(() =>
  this.groupedBookings().filter((b) => b.status === 'UPCOMING')
);
readonly pastBookings = computed(() =>
  this.groupedBookings().filter((b) => b.status !== 'UPCOMING')
);
```

---

## 3. Signal-Based Reactive Form Validation

Instead of heavy `ReactiveFormsModule` control wrappers, component inputs leverage fine-grained Signals for zero-overhead validation state:

```typescript
// Login.ts
readonly email = signal<string>('');
readonly password = signal<string>('');
readonly isSubmitted = signal<boolean>(false);

// Reactive Validation Signals
readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()));
readonly isPasswordValid = computed(() => this.password().length >= 6);

readonly isFormValid = computed(() => this.isEmailValid() && this.isPasswordValid());
```

In the template:
```html
<button mat-flat-button [disabled]="!isFormValid() || isSubmitting()">
  Login
</button>
```

---

## 4. Optimistic UI Updates & Server Sync Pattern

To deliver an instantaneous, lag-free user experience, components use a **Two-Step Optimistic Update Pattern** and **Server Sync Refetching**:

### A. Seat Booking Optimistic Update
```typescript
// BookingPage.ts - onSubmitBooking()
onSubmitBooking(): void {
  const selectedCat = this.selectedCategory();
  const bookedQty = this.quantity();

  this.isSubmitting.set(true);

  this.bookingService.createBooking(payload).subscribe({
    next: (res) => {
      this.isSubmitting.set(false);

      // 🟢 1. Instant Optimistic UI Update (Local Signal Mutation)
      this.seatCategories.update((categories) =>
        categories.map((cat) =>
          cat.id === selectedCat.id
            ? { ...cat, availableSeats: Math.max(0, cat.availableSeats - bookedQty) }
            : cat
        )
      );

      // 🟢 2. Server Sync Re-fetch (Ensures Absolute Truth)
      this.loadEventDetails(this.eventId());

      // Navigate to My Tickets
      this.router.navigate(['/my-tickets'], { queryParams: { confirmed: 'true' } });
    },
    error: (err) => {
      this.isSubmitting.set(false);
      this.bookingError.set(err?.error?.message || 'Booking failed.');
    }
  });
}
```

### B. Booking Cancellation Server Synchronization
```typescript
// MyTickets.ts - cancelBooking()
cancelBooking(booking: GroupedBooking): void {
  this.cancellingBookingId.set(booking.bookingId);

  this.ticketService.cancelBooking(booking.bookingId).subscribe({
    next: () => {
      this.cancellationMessage.set('Booking cancelled successfully.');
      this.cancellingBookingId.set(null);
      
      // Re-fetch tickets from server to automatically re-evaluate computed signals
      this.loadTickets();
    },
    error: (err) => {
      this.errorMessage.set(err?.error?.message || 'Unable to cancel this booking.');
      this.cancellingBookingId.set(null);
    }
  });
}
```

---

## 🧭 Summary of Phase 4
- **100% Signal-Driven:** Zero `BehaviorSubject` memory overhead.
- **Computed Precision:** `totalPrice`, `isSoldOut`, `groupedBookings`, `activeBookings`, `pastBookings`, and `isFormValid` automatically update only when dependencies mutate.
- **Optimistic & Sync Performance:** Instant UI updates paired with absolute-truth backend synchronization.
