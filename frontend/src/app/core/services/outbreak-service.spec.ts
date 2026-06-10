import { TestBed } from '@angular/core/testing';

import { OutbreakService } from './outbreak-service';

describe('OutbreakService', () => {
  let service: OutbreakService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OutbreakService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
