import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-url-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './url-cell-renderer.component.html',
  styleUrl: './url-cell-renderer.component.scss'
})
export class UrlCellRendererComponent {
  public publicUrl!: string;
  public privateUrl?: string;
  public endpointStatus: boolean = false;
  envId: string = localStorage.getItem('environment') ? JSON.parse(`${localStorage.getItem('environment')}`).id : '';
  region: string = 'ap-south-1';
  
  agInit(params: any): void {
    const data = params.data;
    console.log(data);
    this.endpointStatus = data.endpointStatus == 'accessible' ? true : false ;
    if (data?.network?.appIngressDomain == 'None') {
      this.publicUrl = `${ data.name } - ${ this.envId }.dev.${ this.region }.lb.nimbuz.tech`;
      
    } else {
      this.publicUrl = data?.network?.customDomain
        ? data?.network?.customDomain
        :  data?.network?.appIngressDomain || null;
    }
    this.privateUrl = data?.name || null;
  }

  refresh(): boolean {
    return false;
  }
}
