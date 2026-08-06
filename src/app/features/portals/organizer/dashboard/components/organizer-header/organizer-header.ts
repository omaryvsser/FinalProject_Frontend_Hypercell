import { Component, input } from '@angular/core';

@Component({
  selector: 'app-organizer-header',
  standalone: true,
  templateUrl: './organizer-header.html',
  styleUrl: './organizer-header.css'
})
export class OrganizerHeaderComponent {
  organizerEmail = input<string>('organizer@cinema.eg');
}
