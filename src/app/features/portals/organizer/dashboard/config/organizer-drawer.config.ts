import { Type } from '@angular/core';
import { OrganizerMovieFormComponent } from '../components/forms/organizer-movie-form/organizer-movie-form';

export interface OrganizerDrawerConfig {
  title: (isEdit: boolean) => string;
  subtitle: string;
  component: Type<any>;
  wide: boolean;
  submitLabel: (isEdit: boolean) => string;
  getInputs: (ctx: any) => Record<string, any>;
}

export const ORGANIZER_DRAWER_CONFIG: Record<string, OrganizerDrawerConfig> = {
  MOVIE: {
    title: (isEdit) => (isEdit ? 'Edit Movie Details' : 'Add New Movie'),
    subtitle: 'Configure cinema event, pricing tiers, and schedule details',
    component: OrganizerMovieFormComponent,
    wide: true,
    submitLabel: (isEdit) => (isEdit ? 'Save Changes' : 'Create Movie'),
    getInputs: (ctx) => ({
      form: ctx.movieForm,
      model: ctx.movieModel,
      venues: ctx.venues(),
      seatCategories: ctx.seatCategories,
      isEdit: !!ctx.selectedMovie(),
    }),
  },
};
