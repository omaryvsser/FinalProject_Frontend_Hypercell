import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export type ColumnType =
  | 'text'
  | 'user'
  | 'roleSelect'
  | 'badge'
  | 'capacity'
  | 'rating'
  | 'date'
  | 'currency'
  | 'movieTitle'
  | 'venuePill'
  | 'status'
  | 'attendee'
  | 'bookingStatus';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => string;
  badgeClass?: (value: any, row: T) => string;
}

export interface TableAction<T = any> {
  id: string;
  label?: string;
  icon: string;
  cssClass?: string;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTableComponent {
  // Data & Column Configuration Inputs
  readonly data = input<any[]>([]);
  readonly columns = input<TableColumn<any>[]>([]);
  readonly actions = input<TableAction<any>[]>([]);
  readonly emptyMessage = input<string>('No records found.');
  readonly emptyIcon = input<string>('remove_circle_outline');
  readonly currentUserEmail = input<string>('');

  // Pagination Inputs
  readonly totalItems = input<number>(0);
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly pagesArray = input<number[]>([]);
  readonly showPagination = input<boolean>(true);

  // Events / Outputs
  readonly actionClick = output<{ action: string; row: any }>();
  readonly edit = output<any>();
  readonly delete = output<any>();
  readonly roleChange = output<{ row: any; newRole: string }>();
  readonly pageChange = output<number>();

  // Computed displayed columns including optional actions column
  readonly displayedColumnKeys = computed<string[]>(() => {
    const keys = this.columns().map((c) => c.key);
    if (this.actions().length > 0) {
      keys.push('actions');
    }
    return keys;
  });

  onAction(action: TableAction, row: any): void {
    if (action.disabled && action.disabled(row)) return;

    if (action.id === 'edit') {
      this.edit.emit(row);
    } else if (action.id === 'delete') {
      this.delete.emit(row);
    }
    this.actionClick.emit({ action: action.id, row });
  }

  onRoleUpdate(row: any, newRole: string): void {
    this.roleChange.emit({ row, newRole });
  }

  onGoToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  isCurrentUser(email: string): boolean {
    return !!email && email === this.currentUserEmail();
  }

  getCellValue(row: any, col: TableColumn): any {
    const val = row ? row[col.key] : undefined;
    if (col.format) {
      return col.format(val, row);
    }
    return val;
  }
}
