import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TabType, VenueItem } from '../../admin-dashboard';

@Component({
  selector: 'app-slide-over-drawer',
  standalone: true,
  imports: [CommonModule, FormField, MatSelectModule, MatFormFieldModule, MatInputModule],
  templateUrl: './slide-over-drawer.html',
  styleUrl: './slide-over-drawer.css'
})
export class SlideOverDrawerComponent {
  isOpen = input<boolean>(false);
  activeTab = input<TabType>('USERS');
  selectedItem = input<any | null>(null);
  singularTabLabel = input<string>('User');
  currentUserEmail = input<string>('');
  venues = input<VenueItem[]>([]);

  readonly categories = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Science Fiction',
    'Animation',
  ];

  // Signal Forms inputs
  userForm = input.required<any>();
  organizerForm = input.required<any>();
  venueForm = input.required<any>();
  movieForm = input.required<any>();
  movieModel = input.required<WritableSignal<any>>();

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.movieModel().update((m: any) => ({ ...m, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  closeDrawer = output<void>();
  saveItem = output<void>();

  onClose() {
    this.closeDrawer.emit();
  }

  onSave() {
    this.saveItem.emit();
  }

  isCurrentUser(email: string): boolean {
    return email === this.currentUserEmail();
  }
}

