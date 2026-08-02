import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-movie-card',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
})
export class MovieCard {
  readonly title = input.required<string>();
  readonly genre = input.required<string>();
  readonly showtime = input.required<string>();
  readonly cinemaName = input.required<string>();
}
