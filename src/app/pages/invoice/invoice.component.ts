import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AgGridTableComponent } from '../../shared/components/ag-grid-table/ag-grid-table.component';
import { PricingsService } from './pricing.service';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
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
  columnDefs: ColDef[] = [
    {
      field: '', headerName: 'S.NO', width: 80,
      valueGetter: (params) => {
        const a = params.node;
        if(!a || a.rowIndex === null) return 0;
        return a.rowIndex +1
      }
    },
    {
      field: 'id', headerName: 'Invoice Number', flex: 2, tooltipField: 'invoiceNumber',
      cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden !important', 'text-overflow': 'ellipsis' },
    },
    {
      field: 'subtotal', headerName: 'Amount Payable', flex: 1,
      valueFormatter: params =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.data.currency || 'USD',
          minimumFractionDigits: 2,
        }).format(params.value),
    },
    {
      field: 'total', headerName: 'Outstanding Amount', flex: 1,
      valueFormatter: params =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.data.currency || 'USD',
          minimumFractionDigits: 2,
        }).format(params.value)
    },
    {
      field: 'tax_amount', headerName: 'Tax Amount', flex: 1,
      valueFormatter: params =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.data.currency || 'USD',
          minimumFractionDigits: 2,
        }).format(params.value),
    },
    { field: 'currency', headerName: 'Currency', width:100 },
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
        if (
          event.colDef.field === 'status' &&
          event.value === 'draft'
        ) {
          this.openPayNow(event.data);
        }
      }
    },
{
      field: '', headerName: 'Issue Month', flex: 1,
      filter: 'agTextColumnFilter',
      valueGetter: (params: any) => {
        if (!params.data || !params.data.updated_at) return '';
        const date = new Date(params.data.updated_at);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
          month: 'long',
        });
      },
      valueFormatter: (params: any) => {
        return params.value || '';
      },
    },
    {
      field: 'updated_at', headerName: 'Issue Date', flex: 1,
      filter: 'agTextColumnFilter',
      valueGetter: (params: any) => {
        if (!params.data || !params.data.updated_at) return '';
        const date = new Date(params.data.updated_at);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      },
      valueFormatter: (params: any) => {
        return params.value || '';
      },
    },
    // {
    //   field: 'dueDate', headerName: 'Due Date',
    //   flex: 1, valueFormatter: params => {
    //     return new Date(params.value).toLocaleDateString('en-US', {
    //       year: 'numeric',
    //       month: '2-digit',
    //       day: '2-digit'
    //     });
    //   }
    // }
  ];
  cashfree: any;
  limit = 10;
  offset = 0;

  constructor(private http: PricingsService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getInvoiceList()
    this.cashfree = Cashfree({ mode: 'sandbox' });
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
