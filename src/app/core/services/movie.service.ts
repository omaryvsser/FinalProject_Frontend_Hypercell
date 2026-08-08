import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Movie {
  id: number;
  title: string;
  description: string;
  posterUrl?: string;
  genre?: string;
  durationMinutes?: number;
  releaseDate?: string;
  rating?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private http = inject(HttpClient);

  // Adjust base URL if your backend endpoint uses /api/v1/events instead
  private baseUrl = 'http://localhost:8080/api/v1/movies';

  /** Fetch all available movies/events */
  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.baseUrl);
  }

  /** Fetch details for a specific movie by ID */
  getMovieById(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.baseUrl}/${id}`);
  }
}
