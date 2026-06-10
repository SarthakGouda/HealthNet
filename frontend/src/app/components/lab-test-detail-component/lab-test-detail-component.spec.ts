import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabTestDetailComponent } from './lab-test-detail-component';

describe('LabTestDetailComponent', () => {
  let component: LabTestDetailComponent;
  let fixture: ComponentFixture<LabTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabTestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
