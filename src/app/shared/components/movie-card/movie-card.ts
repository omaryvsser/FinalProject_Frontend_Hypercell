import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Movie } from '../../../features/public/discover/discover';

@Component({
  selector: 'app-movie-card',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
})
export class MovieCardComponent {
  @Input({ required: true })
  movie!: Movie;
}

export { MovieCardComponent as MovieCard };

