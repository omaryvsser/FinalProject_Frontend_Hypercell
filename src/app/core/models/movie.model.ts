import { EventResponse } from './event.model';

/**
 * UI-friendly Movie interface.
 * Adapts the backend EventDto.Response for use in the Discover and
 * MovieCard components, preserving all fields the templates rely on.
 */
export interface Movie {
  id: number;
  title: string;
  genre: string;           // maps to EventDto.category
  duration: string;        // formatted duration string
  durationMinutes?: number | null;
  director?: string | null;
  language?: string | null;
  rating: string;          // not in backend — kept for UI compatibility
  showtime: string;        // maps to EventDto.startDate (formatted)
  cinemaName: string;      // maps to EventDto.venueName
  posterUrl: string | null;   // maps to EventDto.imageUrl
  imageUrl: string | null;    // alias for posterUrl (MovieCard uses both)
  description: string;
  status: string;
  isPopular?: boolean;
}

/**
 * Adapter — converts a raw backend EventResponse into the UI Movie shape.
 */
export function eventToMovie(event: EventResponse): Movie {
  return {
    id: Number(event.id),
    title: event.title,
    genre: event.category,
    duration: event.durationMinutes ? `${event.durationMinutes} mins` : '',
    durationMinutes: event.durationMinutes,
    director: event.director ?? '',
    language: event.language ?? '',
    rating: '',             // backend does not expose rating
    showtime: event.startDate
      ? new Date(event.startDate).toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '',
    cinemaName: event.venueName,
    posterUrl: event.imageUrl,
    imageUrl: event.imageUrl,
    description: event.description ?? '',
    status: event.status,
  };
}
