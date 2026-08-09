import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venue } from '../../../../../../core/services/venue.service';

@Component({
  selector: 'app-organizer-slide-over-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizer-slide-over-drawer.html',
  styleUrl: './organizer-slide-over-drawer.css',
})
export class OrganizerSlideOverDrawerComponent {
  // --- Inputs ---
  isOpen = input<boolean>(false);
  selectedMovie = input<any>(null);
  venues = input<Venue[]>([]);

  // --- Two-Way Model Signals ---
  formTitle = model<string>('');
  formDescription = model<string>('');
  formImageUrl = model<string>('');
  formCategory = model<string>('');
  formDirector = model<string>('');
  formDurationMinutes = model<number | null>(null);
  formLanguage = model<string>('');
  formVenueId = model<number | null>(null);
  formStartDate = model<string>('');
  formEndDate = model<string>('');
  formStatus = model<'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'>('DRAFT');

  // --- Outputs ---
  closeDrawer = output<void>();
  saveMovie = output<void>();

  /**
   *  Handles file selection & converts image to Data URL for instant preview & backend storage
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64DataUrl = reader.result as string;
        this.formImageUrl.set(base64DataUrl); // Updates formImageUrl signal
      };

      reader.readAsDataURL(file);
    }
  }

  onClose(): void {
    this.closeDrawer.emit();
  }

  onSubmit(): void {
    this.saveMovie.emit();
  }
}
