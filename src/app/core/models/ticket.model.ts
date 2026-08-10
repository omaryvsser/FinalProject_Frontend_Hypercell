/**
 * Maps Java TicketPaymentDtos.TicketDto
 * Returned by GET /api/tickets/user/{userId}
 */
export interface TicketDto {
  id: number;
  ticketNumber: string;
  eventName: string;
  seatCategoryName: string;
  isBooked: boolean;
  bookingDate: string | null;   // ISO datetime string
  bookingId?: number;
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice?: number;
}

/**
 * Maps Java TicketPaymentDtos.PaymentResultDto
 * Returned after a successful payment
 */
export interface PaymentResultDto {
  paymentId: number;
  bookingId: number;
  status: string;
  message: string;
  paymentDate: string;
}

/**
 * Maps Java TicketPaymentDtos.ProcessPaymentDto
 * Request payload for POST /api/payments
 */
export interface ProcessPaymentRequest {
  bookingId: number;
  paymentMethod: string;
  cardNumber: string;
}
