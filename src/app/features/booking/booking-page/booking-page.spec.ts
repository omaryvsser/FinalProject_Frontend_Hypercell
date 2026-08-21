import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { BookingPage } from './booking-page';
import { BookingService } from '../../../core/services/booking.service';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';

describe('BookingPage', () => {
  let component: BookingPage;
  let fixture: ComponentFixture<BookingPage>;
  let bookingServiceMock: any;
  let eventServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    bookingServiceMock = {
      createBooking: vi.fn().mockReturnValue(of({ bookingId: 456 })),
    };

    eventServiceMock = {
      getEventDetails: vi.fn().mockReturnValue(
        of({
          id: 1,
          title: 'Dune: Part Two',
          venueName: 'Vox Cinema',
          seatCategories: [
            { id: 10, name: 'VIP', price: 200, availableSeats: 50 },
          ],
        })
      ),
    };

    authServiceMock = {
      currentUser: vi.fn().mockReturnValue({
        id: 99,
        name: 'Ahmed El-Sayed',
        email: 'ahmed@cinema.eg',
      }),
      getUserIdFromToken: vi.fn().mockReturnValue(99),
    };

    await TestBed.configureTestingModule({
      imports: [BookingPage],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: 'my-tickets', component: class {} }]),
        { provide: BookingService, useValue: bookingServiceMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();


    fixture = TestBed.createComponent(BookingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create booking page component', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-populate customer details from logged in user', () => {
    expect(component.customerModel().name).toBe('Ahmed El-Sayed');
    expect(component.customerModel().email).toBe('ahmed@cinema.eg');
  });

  it('should require phone number to make form valid', () => {
    expect(component.isFormValid()).toBe(false);

    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    expect(component.isFormValid()).toBe(true);
  });

  it('should call BookingService.createBooking on confirmBooking with valid form', () => {
    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    expect(component.isFormValid()).toBe(true);

    component.confirmBooking();

    expect(bookingServiceMock.createBooking).toHaveBeenCalledWith({
      eventId: 1,
      userId: 99,
      seatCategoryId: 10,
      quantity: 1,
    });
  });

  it('should prevent incrementing beyond 8 tickets even if more seats are available', () => {
    // Available seats is 50 in mock, but max allowed is 8
    for (let i = 0; i < 15; i++) {
      component.incrementQuantity();
    }
    expect(component.quantity()).toBe(8);
  });

  it('should allow booking exactly 8 tickets', () => {
    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    for (let i = 0; i < 7; i++) {
      component.incrementQuantity();
    }
    expect(component.quantity()).toBe(8);
    expect(component.isFormValid()).toBe(true);

    component.confirmBooking();
    expect(bookingServiceMock.createBooking).toHaveBeenCalledWith({
      eventId: 1,
      userId: 99,
      seatCategoryId: 10,
      quantity: 8,
    });
  });

  it('should invalidate form and reject submit if quantity exceeds 8', () => {
    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    // Force quantity to 9 (e.g. if manipulated)
    component.quantity.set(9);
    expect(component.isFormValid()).toBe(false);

    component.onSubmitBooking();
    expect(bookingServiceMock.createBooking).not.toHaveBeenCalled();
    expect(component.bookingError()).toContain('Maximum 8 tickets');
  });
});
