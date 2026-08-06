import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Movie } from '../../../features/public/discover/discover';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;

  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  // دالة آمنة تجلب رابط الصورة بغض النظر عن اسمها في الـ Interface
  get movieImage(): string {
    const m = this.movie as any;
    return m?.poster || m?.posterUrl || m?.image || m?.imageUrl || m?.poster_path || '';
  }

  onBookSeats(): void {
    this.bookingService.initiateBooking({
      id: this.movie.id,
      title: this.movie.title,
      showtime: this.movie.showtime,
      cinemaName: this.movie.cinemaName,
      price: 150
    });

    this.router.navigate(['/booking']);
  }
}

export { MovieCardComponent as MovieCard };