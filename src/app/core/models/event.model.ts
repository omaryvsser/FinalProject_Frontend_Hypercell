/** Maps Java EventDto.Response */
export interface EventResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;   // ISO datetime string from backend
  endDate: string;
  status: EventStatus;
  venueId?: number | null;
  venueName: string;
  imageUrl: string | null;
}

/** Maps Java EventDto.DetailResponse */
export interface EventDetailResponse extends EventResponse {
  venueAddress: string;
  seatCategories: SeatCategoryResponse[];
}

export interface SeatCategoryResponse {
  id: number;
  categoryName: SeatCategoryName;
  price: number;
  availableSeats: number;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type SeatCategoryName = 'STANDARD' | 'VIP' | 'IMAX' | 'PREMIUM';

/** Spring Page<T> wrapper */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
