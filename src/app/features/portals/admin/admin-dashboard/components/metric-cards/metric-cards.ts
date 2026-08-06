import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-cards',
  standalone: true,
  templateUrl: './metric-cards.html',
  styleUrl: './metric-cards.css'
})
export class MetricCardsComponent {
  totalUsersCount = input<number>(0);
  activeOrganizersCount = input<number>(0);
  registeredVenuesCount = input<number>(0);
  totalMoviesCount = input<number>(0);
}
