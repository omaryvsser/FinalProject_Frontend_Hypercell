import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieCard } from './movie-card';

describe('MovieCard', () => {
  let component: MovieCard;
  let fixture: ComponentFixture<MovieCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieCard);
    component = fixture.componentInstance;
    component.movie = {
      id: 1,
      title: 'Interstellar',
      genre: 'Science Fiction',
      duration: '2h 49m',
      rating: '8.7',
      showtime: 'Friday, 8:00 PM',
      cinemaName: 'Hypercell IMAX',
      isPopular: true,
    };
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
