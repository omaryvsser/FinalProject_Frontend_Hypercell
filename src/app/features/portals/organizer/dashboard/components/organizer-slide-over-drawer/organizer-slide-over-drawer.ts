import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-organizer-slide-over-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizer-slide-over-drawer.html',
  styleUrl: './organizer-slide-over-drawer.css'
})
export class OrganizerSlideOverDrawerComponent {
  isOpen = input<boolean>(false);
  selectedMovie = input<any | null>(null);

  formTitle = input.required<WritableSignal<string>>();
  formCategory = input.required<WritableSignal<string>>();
  formVenueName = input.required<WritableSignal<string>>();
  formStartDate = input.required<WritableSignal<string>>();
  formStatus = input.required<WritableSignal<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>>();

  closeDrawer = output<void>();
  saveMovie = output<void>();

  onClose() {
    this.closeDrawer.emit();
  }

  onSave() {
    this.saveMovie.emit();
  }
}
