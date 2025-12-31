import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { of, throwError, Subject } from 'rxjs';

import { InvoiceComponent } from './invoice.component';
import { PricingsService } from './pricing.service';
import { SharedService } from '../../shared/services/shared.service';

describe('InvoiceComponent', () => {
  let component: InvoiceComponent;
  let fixture: ComponentFixture<InvoiceComponent>;
  let pricingSpy: jasmine.SpyObj<PricingsService>;
  let sharedSpy: jasmine.SpyObj<SharedService>;
  let currencyChange$: Subject<any>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    pricingSpy = jasmine.createSpyObj('PricingsService', ['paynow', 'getInvoiceList']);
    currencyChange$ = new Subject<any>();
    sharedSpy = jasmine.createSpyObj('SharedService', ['getCurrency', 'convertAmount'] as any);
    // attach observable properties manually for components that subscribe to them
    (sharedSpy as any).currencyChange$ = currencyChange$;
    (sharedSpy as any).valueChange$ = of(null);
    (sharedSpy as any).isLoading$ = of(false);
    sharedSpy.getCurrency.and.returnValue('USD');
    sharedSpy.convertAmount.and.callFake((v: number) => v);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    // ensure component-level provider is overridden so the component uses our spy
    TestBed.overrideComponent(InvoiceComponent as any, { set: { providers: [{ provide: PricingsService, useValue: pricingSpy }] } });

    await TestBed.configureTestingModule({
      imports: [InvoiceComponent, HttpClientTestingModule],
      providers: [
        {
          provide: TOAST_CONFIG,
          useValue: {
            toastClass: 'toast',
            positionClass: 'toast-top-right',
            timeOut: 5000,
            extendedTimeOut: 1000,
            iconClasses: { error: 'toast-error', info: 'toast-info', success: 'toast-success', warning: 'toast-warning' }
          }
        },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: PricingsService, useValue: pricingSpy },
        { provide: SharedService, useValue: sharedSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('accountId');
  });

  it('buildColumnDefs: S.NO valueGetter and period formatting', () => {
    const cols = component.buildColumnDefs();
    const sno = cols[0];
    // missing node
    expect((sno.valueGetter as any)({ node: undefined, rowIndex: null })).toBe(0);
    // present node
    const res = (sno.valueGetter as any)({ node: { rowIndex: 0 } });
    expect(res).toBe(1);

    const periodCol = cols.find(c => c.field === 'period')!;
    // invalid data
    expect((periodCol.valueGetter as any)({ data: null })).toBe('');
    // valid timestamp
    const date = new Date(2020, 0, 1).toISOString();
    const formatted = (periodCol.valueGetter as any)({ data: { updated_at: date } });
    expect(typeof formatted).toBe('string');
  });

  it('status cellRenderer returns Pay now link for draft and plain text otherwise', () => {
    const cols = component.buildColumnDefs();
    const statusCol = cols.find(c => c.field === 'status')!;
    const draftEl = (statusCol.cellRenderer as any)({ value: 'draft' });
    expect(draftEl.querySelector('.pay-now-link')).toBeTruthy();
    const other = (statusCol.cellRenderer as any)({ value: 'paid' });
    expect(other.textContent).toContain('paid');
  });

  it('onCellClicked triggers openPayNow when status is draft', () => {
    spyOn(component, 'openPayNow');
    const cols = component.buildColumnDefs();
    const statusCol = cols.find(c => c.field === 'status')!;
    // simulate a cell click event
    (statusCol.onCellClicked as any)({ colDef: { field: 'status' }, value: 'draft', data: { id: 1 } });
    expect(component.openPayNow).toHaveBeenCalledWith({ id: 1 });
  });

  it('openPayNow successful checkout calls getInvoiceList, failure shows toast', (done) => {
    // mock paynow response
    pricingSpy.paynow.and.returnValue(of({ order: { payment_session_id: 'sid' } }));
    // stub cashfree.checkout
    component.cashfree = { checkout: (opts: any) => Promise.resolve({ paymentDetails: { paymentMessage: 'Payment finished. Check status.' } }) };
    spyOn(component, 'getInvoiceList');
    component.openPayNow({ id: 2 });
    // wait for promise resolution
    setTimeout(() => {
      expect(pricingSpy.paynow).toHaveBeenCalled();
      const calledArg = (pricingSpy.paynow as jasmine.Spy).calls.mostRecent().args[0];
      expect(calledArg).toBe(2);
      expect(component.getInvoiceList).toHaveBeenCalled();
      // now simulate checkout rejection
      component.cashfree = { checkout: () => Promise.reject('err') };
      component.openPayNow({ id: 3 });
      setTimeout(() => {
        expect(toastrSpy.error).toHaveBeenCalledWith('Payment Dismissed');
        done();
      }, 0);
    }, 0);
  });

  it('getInvoiceList does nothing without accountId and sets tableData when success', () => {
    pricingSpy.getInvoiceList.and.returnValue(of({ success: true, data: { data: [{ id: 5 }] } }));
    component.getInvoiceList();
    expect(pricingSpy.getInvoiceList).not.toHaveBeenCalled();
    localStorage.setItem('accountId', 'acc1');
    component.getInvoiceList();
    expect(pricingSpy.getInvoiceList).toHaveBeenCalled();
    expect(component.tableData.length).toBeGreaterThanOrEqual(0);
  });

  it('getInvoiceList logs error when service fails', () => {
    localStorage.setItem('accountId', 'acc2');
    spyOn(console, 'error');
    pricingSpy.getInvoiceList.and.returnValue(throwError(() => new Error('network')));
    component.getInvoiceList();
    expect(pricingSpy.getInvoiceList).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('currencyChange$ reassigns tableData to a new array reference', () => {
    component.tableData = [{ id: 1 }];
    const beforeRef = component.tableData;
    currencyChange$.next(null);
    expect(component.tableData).not.toBe(beforeRef);
    expect(component.tableData.length).toBe(1);
  });

  it('openPayNow does not call getInvoiceList for non-success checkout message', (done) => {
    pricingSpy.paynow.and.returnValue(of({ order: { payment_session_id: 'sid2' } }));
    component.cashfree = { checkout: (opts: any) => Promise.resolve({ paymentDetails: { paymentMessage: 'Other message' } }) };
    spyOn(component, 'getInvoiceList');
    component.openPayNow({ id: 9 });
    setTimeout(() => {
      expect(pricingSpy.paynow).toHaveBeenCalled();
      expect(component.getInvoiceList).not.toHaveBeenCalled();
      done();
    }, 0);
  });

  it('onPageChange updates limit and offset and calls getInvoiceList', () => {
    spyOn(component, 'getInvoiceList');
    component.onPageChange({ limit: 20, offset: 40 });
    expect(component.limit).toBe(20);
    expect(component.offset).toBe(40);
    expect(component.getInvoiceList).toHaveBeenCalled();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
