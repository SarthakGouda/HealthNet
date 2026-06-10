import { TestBed } from '@angular/core/testing';
import { LabTestService } from './lab-test.service';

describe('LabTestService', () => {
  let service: LabTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LabTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
