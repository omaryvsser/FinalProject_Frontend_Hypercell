/**
 * Maps Java BookingDto.CreateRequest
 * Request payload for POST /api/bookings
 */
export interface BookingCreateRequest {
  eventId: number;
  userId: number;
  seatCategoryId: number;
  quantity: number;
  seatIds?: number[];
}

/**
 * Maps Java BookingDto.Response
 * Returned by POST /api/bookings and GET /api/bookings/user/{userId}
 */
export interface BookingResponse {
  bookingId: number;
  customerName?: string;
  customerEmail?: string;
  organizerName?: string;
  eventTitle: string;
  seatCategoryName: string;
  quantity: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;   // ISO datetime string
  seatCodes?: string[];
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
