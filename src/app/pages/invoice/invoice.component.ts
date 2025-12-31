import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { PricingsService } from './pricing.service';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../shared/services/shared.service';
import { environment } from '../../../environments/environment';
declare const Cashfree: any;

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, AgGridTableComponent],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
  providers: [PricingsService]
})
export class InvoiceComponent implements OnInit {

  tableData: any[] = [];
  columnDefs: ColDef[] = [];
  
  buildColumnDefs(): ColDef[] {
    const fmt = (value: number, from: string | undefined) => {
      const target = this.sharedService.getCurrency() || 'USD';
      const converted = this.sharedService.convertAmount(Number(value), from || 'USD', target);
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: target,
          minimumFractionDigits: 2,
        }).format(converted);
      } catch (e) {
        return String(converted);
      }
    };

    return [
      {
        field: '', headerName: 'S.NO', width: 80,
        valueGetter: (params) => {
          const a = params.node;
          if (!a || a.rowIndex === null) return 0;
          return a.rowIndex + 1;
        }
      },
      {
        field: 'id', headerName: 'Invoice Number', flex: 2, tooltipField: 'invoiceNumber',
        cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
      },
      {
        field: 'subtotal', headerName: 'Amount Payable', flex: 1,
        valueFormatter: (params: any) => fmt(params.value, params.data?.currency)
      },
      {
        field: 'total', headerName: 'Outstanding Amount', flex: 1,
        valueFormatter: (params: any) => fmt(params.value, params.data?.currency)
      },
      {
        field: 'tax_amount', headerName: 'Tax Amount', flex: 1,
        valueFormatter: (params: any) => fmt(params.value, params.data?.currency)
      },
      {
        field: 'currency', headerName: 'Currency', width: 120,
        valueGetter: (params: any) => {
          // const target = this.sharedService.getCurrency() || 'USD';
          // const src = params.data?.currency || '';
          return this.sharedService.getCurrency() || 'USD';
        }
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        cellRenderer: (params: any) => {
          const wrapper = document.createElement('div');
          wrapper.style.textAlign = 'left';
          wrapper.style.color = '#659711';
          wrapper.style.textTransform = 'capitalize';

          if (params.value === 'draft') {
            const link = document.createElement('a');
            link.className = 'pay-now-link';
            link.textContent = 'Pay now';
            link.style.textDecoration = 'underline';
            link.style.color = '#F60';
            link.style.cursor = 'pointer';

            wrapper.appendChild(link);
          } else {
            wrapper.textContent = params.value;
          }

          return wrapper;
        },
        onCellClicked: (event: CellClickedEvent) => {
          if (event.colDef.field === 'status' && event.value === 'draft') {
            this.openPayNow(event.data);
          }
        }
      },
      {
        field: 'period', headerName: 'Invoice Period', flex: 1,
        filter: 'agTextColumnFilter',
        valueGetter: (params: any) => {
          if (!params.data || !params.data.updated_at) return '';
          const date = new Date(params.data.updated_at);
          return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          });
        },
        valueFormatter: (params: any) => {
          return params.value || '';
        },
      }
    ];
  }
  cashfree: any;
  limit = 10;
  offset = 0;

  constructor(private http: PricingsService, private toastr: ToastrService, private sharedService: SharedService) { }

  ngOnInit(): void {
    this.getInvoiceList();
    this.columnDefs = this.buildColumnDefs();
    // refresh table when currency changes by reassigning the data array
    this.sharedService.currencyChange$.subscribe(() => {
      this.tableData = Array.isArray(this.tableData) ? [...this.tableData] : this.tableData;
    });
    try {
      if (typeof Cashfree !== 'undefined') {
        this.cashfree = Cashfree({ mode: environment.cashFree });
      }
    } catch (e) {
      // Cashfree SDK not available in test environments; ignore
      this.cashfree = undefined;
    }
    // this.cashfree.on('payment.success', (event: any) => {
    //   console.log('Payment Success:', event);
    //   this.toastr.success(event.transaction.txnId);
    // });

    // this.cashfree.on('payment.failed', (event: any) => {
    //   console.error('Payment Failed:', event);
    //   this.toastr.error(event.transaction.message);
    // });

    // this.cashfree.on('payment.dismissed', (event: any) => {
    //   console.warn('Payment Dismissed:', event);
    //   this.toastr.warning('Payment Dismissed');
    // });
  }

  goToNewDeployModel(data: any) {
    console.log('Navigating to new deployment modal with data:', data);
  }

  openPayNow(data: any) {
    this.http.paynow(data.id).subscribe({
      next: (data: any) => {
        const sessionId = data.order.payment_session_id;

        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: '_modal',
        };
        this.cashfree.checkout(checkoutOptions).then((res: any) => {
          const message = res?.paymentDetails?.paymentMessage;
          if (message === 'Payment finished. Check status.') {
            this.getInvoiceList()
          }
        }, (error: any) => {
          this.toastr.error('Payment Dismissed');
        });

      }

    });
  }
  getInvoiceList() {
    const accountId = localStorage.getItem('accountId');
    const currentDate = new Date();
    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    if (accountId) {
      this.http.getInvoiceList(accountId, this.limit, this.offset).subscribe({
        next: (data: any) => {
          if (data.success) {
            this.tableData = data.data?.data || [];
          }
        },
        error: (error) => {
          console.error('Error fetching invoice data:', error);
        }
      });
    }
  }
  onPageChange(event: { limit: number; offset: number }) {
    this.limit = event.limit;
    this.offset = event.offset;
    this.getInvoiceList();
  }
}
