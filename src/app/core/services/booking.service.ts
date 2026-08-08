import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface BookingDetails {
  id?: string;
  movieId: number;
  movieTitle: string;
  showtime: string;
  cinemaName: string;
  ticketCount: number;
  ticketPrice: number;
  totalPrice?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private STORAGE_KEY = 'cinetick_user_bookings';

  private currentBookingSignal = signal<BookingDetails | null>(null);
  readonly currentBooking = this.currentBookingSignal.asReadonly();

  private myBookingsSignal = signal<BookingDetails[]>(this.loadBookingsFromStorage());
  readonly myBookings = this.myBookingsSignal.asReadonly();

  initiateBooking(movie: { id: number; title: string; showtime: string; cinemaName: string; price?: number }) {
    this.currentBookingSignal.set({
      movieId: movie.id,
      movieTitle: movie.title,
      showtime: movie.showtime || 'Friday, 8:00 PM',
      cinemaName: movie.cinemaName || 'Hypercell Cinema',
      ticketCount: 1,
      ticketPrice: movie.price || 150,
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    });
  }

  confirmBooking(formData?: Partial<BookingDetails>): BookingDetails | null {
    const current = this.currentBookingSignal();
    
    const baseData = current || (formData ? {
      movieId: 1,
      movieTitle: 'Movie',
      cinemaName: 'Hypercell Cinema',
      ticketPrice: 150,
      ...formData
    } : null);

    if (!baseData) return null;

    const ticketCount = formData?.ticketCount || baseData.ticketCount || 1;
    const ticketPrice = baseData.ticketPrice || 150;

    const confirmedBooking: BookingDetails = {
      ...baseData,
      ...formData,
      id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      bookingDate: new Date(),
      ticketCount: ticketCount,
      ticketPrice: ticketPrice,
      totalPrice: ticketCount * ticketPrice
    } as BookingDetails;

    const updatedList = [confirmedBooking, ...this.myBookingsSignal()];
    this.myBookingsSignal.set(updatedList);
    this.saveBookingsToStorage(updatedList);

    return confirmedBooking;
  }

  clearCurrentBooking() {
    this.currentBookingSignal.set(null);
  }

  refreshBookings() {
    this.myBookingsSignal.set(this.loadBookingsFromStorage());
  }

  private saveBookingsToStorage(bookings: BookingDetails[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {}
  }

  private loadBookingsFromStorage(): BookingDetails[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}