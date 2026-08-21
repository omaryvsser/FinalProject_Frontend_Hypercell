import { Type } from '@angular/core';
import { UserFormComponent } from '../components/forms/user-form/user-form';
import { OrganizerFormComponent } from '../components/forms/organizer-form/organizer-form';
import { VenueFormComponent } from '../components/forms/venue-form/venue-form';
import { MovieFormComponent } from '../components/forms/movie-form/movie-form';
import { TabType } from '../admin-dashboard';

export interface AdminDrawerItemConfig {
  title: (isEdit: boolean, label: string) => string;
  subtitle: (isEdit: boolean, label: string) => string;
  component: Type<any>;
  wide?: boolean;
  submitLabel: (isEdit: boolean, label: string) => string;
  getInputs: (ctx: any) => Record<string, any>;
}

export const ADMIN_DRAWER_CONFIG: Partial<Record<TabType, AdminDrawerItemConfig>> = {
  USERS: {
    title: (isEdit, label) => (isEdit ? `Edit ${label}` : `Add New ${label}`),
    subtitle: (_, label) => `Configure details for this ${label.toLowerCase()}`,
    component: UserFormComponent,
    wide: false,
    submitLabel: (isEdit, label) => (isEdit ? 'Save Changes' : `Create ${label}`),
    getInputs: (ctx) => ({
      form: ctx.userForm,
      isEdit: !!ctx.selectedItem(),
      isCurrentLoggedInUser: ctx.selectedItem()?.email === ctx.currentUserEmail(),
    }),
  },
  ORGANIZERS: {
    title: (isEdit, label) => (isEdit ? `Edit ${label}` : `Add New ${label}`),
    subtitle: (_, label) => `Configure details for this ${label.toLowerCase()}`,
    component: OrganizerFormComponent,
    wide: false,
    submitLabel: (isEdit, label) => (isEdit ? 'Save Changes' : `Create ${label}`),
    getInputs: (ctx) => ({
      form: ctx.organizerForm,
      isEdit: !!ctx.selectedItem(),
    }),
  },
  VENUES: {
    title: (isEdit, label) => (isEdit ? `Edit ${label}` : `Add New ${label}`),
    subtitle: (_, label) => `Configure details for this ${label.toLowerCase()}`,
    component: VenueFormComponent,
    wide: false,
    submitLabel: (isEdit, label) => (isEdit ? 'Save Changes' : `Create ${label}`),
    getInputs: (ctx) => ({
      form: ctx.venueForm,
      isEdit: !!ctx.selectedItem(),
    }),
  },
  MOVIES: {
    title: (isEdit, label) => (isEdit ? `Edit ${label}` : `Add New ${label}`),
    subtitle: (_, label) => `Configure details for this ${label.toLowerCase()}`,
    component: MovieFormComponent,
    wide: true,
    submitLabel: (isEdit, label) => (isEdit ? 'Save Changes' : `Create ${label}`),
    getInputs: (ctx) => ({
      form: ctx.movieForm,
      model: ctx.movieModel,
      venues: ctx.venues(),
      isEdit: !!ctx.selectedItem(),
    }),
  },
};
