import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BookingService } from './booking.service';
import { environment } from '../../../environments/environment';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call PATCH /api/bookings/{id}/cancel on cancelBooking', () => {
    const bookingId = 44;
    const expectedResponse = 'Booking cancelled successfully and seats restored.';

    service.cancelBooking(bookingId).subscribe((res) => {
      expect(res).toBe(expectedResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings/${bookingId}/cancel`);
    expect(req.request.method).toBe('PATCH');
    req.flush(expectedResponse);
  });

  it('should call PATCH /api/bookings/{id}/status on updateBookingStatus', () => {
    const bookingId = 44;
    const newStatus = 'PENDING';
    const mockResponse = {
      bookingId: 44,
      customerName: 'Kareem',
      customerEmail: 'k@gmail.com',
      organizerName: 'Organizer One',
      eventTitle: 'THE SOPRANOS',
      seatCategoryName: 'STANDARD',
      quantity: 2,
      totalPrice: 300,
      status: 'PENDING' as any,
      createdAt: '2026-08-21T16:30:54',
    };

    service.updateBookingStatus(bookingId, newStatus).subscribe((res) => {
      expect(res.status).toBe('PENDING');
      expect(res.bookingId).toBe(44);
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings/${bookingId}/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: newStatus });
    req.flush(mockResponse);
  });

  it('should fetch paginated bookings for admin', () => {
    service.getPaginatedBookings(1, 5).subscribe((res) => {
      expect(res.totalElements).toBe(28);
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings?page=0&size=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 28, totalPages: 6 });
  });

  it('should fetch paginated bookings for organizer', () => {
    service.getOrganizerBookings(2, 5).subscribe((res) => {
      expect(res.totalElements).toBe(13);
    });

    const req = httpMock.expectOne(`${apiUrl}/bookings/organizer?page=1&size=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 13, totalPages: 3 });
  });
});
