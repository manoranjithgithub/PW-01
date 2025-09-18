import { AfterViewChecked, Component, OnDestroy, OnInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { DeploymentsService } from '../../../shared/services/deployments.service';
import { SharedService } from '../../../shared/services/shared.service';
import { CardGroupComponent, CardComponent, CardBodyComponent} from '@coreui/angular';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-deployment-logs',
    standalone:true,
    imports: [CardGroupComponent, CardComponent, CardBodyComponent, CommonModule, LoaderComponent],
    providers: [DeploymentsService],
    templateUrl: './deployment-logs.component.html',
    styleUrl: './deployment-logs.component.scss'
})
export class DeploymentLogsComponent implements OnInit , OnDestroy, AfterViewChecked {

  isAutoRefresh: boolean = false;
  envId:string = '';
  deploymentId:string = '';
  deploymentLogs:any = '';
  previousLogs:boolean = false;

  private subscription: Subscription = new Subscription();
  tableTheme = 'ag-theme-alpine';
  private intervalId: any;

  constructor(private router:Router,
     private http:DeploymentsService,
      private sharedService:SharedService,
    private activateRoute : ActivatedRoute)
    {
    // this.envId = JSON.parse(`${this.sharedService.getCookie('environment')}`).id;
    this.envId = JSON.parse(`${localStorage.getItem('environment')}`).id;
    
    this.activateRoute.queryParams.subscribe(params => {
      if(params['id'] != undefined)
        this.deploymentId = params['id'];
      });
      // this.tableTheme = this.sharedService.getCookie('theme');
      this.tableTheme = localStorage.getItem('theme') || 'ag-theme-alpine';
    }

    ngOnInit(): void {
      this.subscription = this.sharedService.envValueChange$.subscribe(value => {
        this.router.navigate(['/deployment']);
     });
        this.getDeploymentsLogs();
        this.sharedService.valueChange$.subscribe(value => {
          this.tableTheme = value;
        });
    }

    ngAfterViewChecked () {
      this.scrollToBottom();
    }
  
     scrollToBottom() : void {
      const container = document.getElementById('logContainer');
        if(container)
            container.scrollTop = container.scrollHeight;
    }

    onPreviousLogsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.previousLogs = checkbox.checked;
    this.getDeploymentsLogs();
  }

  goToDeployments():void{
    window.history.back();
  }

  toggleAutoRefresh() {
    this.isAutoRefresh = !this.isAutoRefresh;
    if(this.isAutoRefresh){
      //refreshes logs every 10secs
      this.intervalId = setInterval(() =>  {
         this.getDeploymentsLogs();
      }, 10000);
    }
    else{
      this.clearTimer();
    }
  }

  getDeploymentsLogs() : void {
    this.http.getDeploymentLogs(this.envId, this.deploymentId,this.previousLogs ).subscribe(
      (data: any) => {
        if(this.previousLogs)
          this.deploymentLogs = data.previousLogs;
        else
          this.deploymentLogs = data.logs + data.previousLogs;
       },
      error => {
        console.error('Error:', error);
      });
  }

  ngOnDestroy() {
    this.clearTimer(); 
    this.subscription?.unsubscribe();
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId); 
      this.intervalId = null; 
    }
  }
  
}
