/** Backend request contract: TicketPaymentDtos.ProcessPaymentDto */
export interface ProcessPaymentRequest {
  bookingId: number;
  paymentMethod: string;
  cardNumber: string;
}

/** Backend response contract: TicketPaymentDtos.PaymentResultDto */
export interface PaymentResultDto {
  paymentId: number;
  bookingId: number;
  status: string;
  message: string;
  paymentDate: string;
}
