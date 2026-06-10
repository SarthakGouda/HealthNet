import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabTestEditComponent } from './lab-test-edit-component';

describe('LabTestEditComponent', () => {
  let component: LabTestEditComponent;
  let fixture: ComponentFixture<LabTestEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabTestEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabTestEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
