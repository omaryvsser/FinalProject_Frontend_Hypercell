/**
 * Cinema Seat Model for dynamic map rendering and selection.
 */
export interface Seat {
  id: number;
  seatCode: string;
  row: string;
  number: number;
  category: 'STANDARD' | 'VIP' | 'IMAX' | string;
  price: number;
  seatCategoryId: number;
  status: 'AVAILABLE' | 'BOOKED' | 'SELECTED';
}

export interface SeatMapLayout {
  eventId: number;
  eventTitle: string;
  venueId?: number;
  venueName?: string;
  venueCapacity?: number;
  seats: Seat[];
  rows: string[];
}
