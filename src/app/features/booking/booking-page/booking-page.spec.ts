import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { BookingPage } from './booking-page';
import { BookingService } from '../../../core/services/booking.service';
import { EventService } from '../../../core/services/event.service';
import { SeatService } from '../../../core/services/seat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Seat } from '../../../core/models/seat.model';

describe('BookingPage', () => {
  let component: BookingPage;
  let fixture: ComponentFixture<BookingPage>;
  let bookingServiceMock: any;
  let eventServiceMock: any;
  let seatServiceMock: any;
  let authServiceMock: any;

  const mockSeats: Seat[] = [
    { id: 101, seatCode: 'A1', row: 'A', number: 1, category: 'VIP', price: 200, seatCategoryId: 10, status: 'AVAILABLE' },
    { id: 102, seatCode: 'A2', row: 'A', number: 2, category: 'VIP', price: 200, seatCategoryId: 10, status: 'AVAILABLE' },
    { id: 103, seatCode: 'A3', row: 'A', number: 3, category: 'VIP', price: 200, seatCategoryId: 10, status: 'BOOKED' },
    { id: 104, seatCode: 'B1', row: 'B', number: 1, category: 'STANDARD', price: 150, seatCategoryId: 11, status: 'AVAILABLE' },
    { id: 105, seatCode: 'B2', row: 'B', number: 2, category: 'STANDARD', price: 150, seatCategoryId: 11, status: 'AVAILABLE' },
  ];

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
            { id: 11, name: 'STANDARD', price: 150, availableSeats: 100 },
          ],
        })
      ),
    };

    seatServiceMock = {
      getEventSeats: vi.fn().mockReturnValue(of(mockSeats)),
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
        { provide: SeatService, useValue: seatServiceMock },
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
    expect(component.seats().length).toBe(5);
  });

  it('should auto-populate customer details from logged in user', () => {
    expect(component.customerModel().name).toBe('Ahmed El-Sayed');
    expect(component.customerModel().email).toBe('ahmed@cinema.eg');
  });

  it('should toggle seat selection and calculate total price', () => {
    const seatA1 = mockSeats[0];
    const seatA2 = mockSeats[1];

    component.toggleSeat(seatA1);
    expect(component.selectedSeats().length).toBe(1);
    expect(component.totalPrice()).toBe(200);

    component.toggleSeat(seatA2);
    expect(component.selectedSeats().length).toBe(2);
    expect(component.totalPrice()).toBe(400);

    // Deselect A1
    component.toggleSeat(seatA1);
    expect(component.selectedSeats().length).toBe(1);
    expect(component.selectedSeats()[0].seatCode).toBe('A2');
    expect(component.totalPrice()).toBe(200);
  });

  it('should not allow selecting booked seats', () => {
    const bookedSeat = mockSeats[2]; // A3 is BOOKED
    component.toggleSeat(bookedSeat);
    expect(component.selectedSeats().length).toBe(0);
  });

  it('should enforce maximum 8 seats selection limit', () => {
    const seatsToSelect: Seat[] = [];
    for (let i = 1; i <= 9; i++) {
      seatsToSelect.push({
        id: 200 + i,
        seatCode: `C${i}`,
        row: 'C',
        number: i,
        category: 'STANDARD',
        price: 150,
        seatCategoryId: 11,
        status: 'AVAILABLE',
      });
    }

    for (let i = 0; i < 8; i++) {
      component.toggleSeat(seatsToSelect[i]);
    }
    expect(component.selectedSeats().length).toBe(8);

    // Try 9th seat
    component.toggleSeat(seatsToSelect[8]);
    expect(component.selectedSeats().length).toBe(8);
    expect(component.seatLimitWarning()).toContain('Maximum 8 seats allowed');
  });

  it('should call BookingService.createBooking with seatIds on submit', () => {
    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    component.toggleSeat(mockSeats[0]); // A1 (id: 101)
    component.toggleSeat(mockSeats[1]); // A2 (id: 102)

    expect(component.isFormValid()).toBe(true);

    component.confirmBooking();

    expect(bookingServiceMock.createBooking).toHaveBeenCalledWith({
      eventId: 1,
      userId: 99,
      seatCategoryId: 10,
      quantity: 2,
      seatIds: [101, 102],
    });
  });

  it('should handle concurrency conflict error by displaying clear message and refreshing seats', () => {
    component.customerModel.update((m) => ({ ...m, phone: '01012345678' }));
    component.toggleSeat(mockSeats[0]);

    bookingServiceMock.createBooking.mockReturnValue(
      throwError(() => ({
        error: { message: 'One or more selected seats are no longer available. Please choose different seats.' },
      }))
    );

    component.confirmBooking();

    expect(component.bookingError()).toContain('no longer available');
    expect(seatServiceMock.getEventSeats).toHaveBeenCalled();
  });
});
