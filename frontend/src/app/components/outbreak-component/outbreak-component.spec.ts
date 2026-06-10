import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutbreakFormComponent } from './outbreak-component';

describe('OutbreakFormComponent', () => {
  let component: OutbreakFormComponent;
  let fixture: ComponentFixture<OutbreakFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutbreakFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutbreakFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});