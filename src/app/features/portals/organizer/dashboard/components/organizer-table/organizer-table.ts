import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

export interface OrganizerMovie {
  id: number;
  title: string;
  category: string;
  startDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  venueName: string;
  bookings: number;
  attendees: number;
}

@Component({
  selector: 'app-organizer-table',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './organizer-table.html',
  styleUrl: './organizer-table.css'
})
export class OrganizerTableComponent {
  movies = input<OrganizerMovie[]>([]);
  totalItems = input<number>(0);
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  pagesArray = input<number[]>([]);

  editMovie = output<OrganizerMovie>();
  deleteMovie = output<OrganizerMovie>();
  viewAttendees = output<OrganizerMovie>();
  pageChange = output<number>();

  readonly displayedColumns = ['title', 'venue', 'showtime', 'status', 'actions'];

  onEdit(movie: OrganizerMovie) {
    this.editMovie.emit(movie);
  }

  onDelete(movie: OrganizerMovie) {
    this.deleteMovie.emit(movie);
  }

  onViewAttendees(movie: OrganizerMovie) {
    this.viewAttendees.emit(movie);
  }

  onGoToPage(page: number) {
    this.pageChange.emit(page);
  }
}
