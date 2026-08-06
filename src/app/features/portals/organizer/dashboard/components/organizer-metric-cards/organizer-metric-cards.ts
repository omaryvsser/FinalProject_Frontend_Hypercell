import { Component, input } from '@angular/core';

@Component({
  selector: 'app-organizer-metric-cards',
  standalone: true,
  templateUrl: './organizer-metric-cards.html',
  styleUrl: './organizer-metric-cards.css'
})
export class OrganizerMetricCardsComponent {
  totalMovies = input<number>(0);
  publishedMovies = input<number>(0);
  totalBookings = input<number>(0);
  totalAttendees = input<number>(0);
}
