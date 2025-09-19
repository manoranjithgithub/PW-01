import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../../services/deployments.service';

@Component({
    selector: 'app-redirect',
    standalone:true,
    imports: [],
    templateUrl: './redirect.component.html',
    styleUrl: './redirect.component.scss',
    providers: [DeploymentsService]
})
export class RedirectComponent implements OnInit {
  authorizationCode: string = '';
  
  
  constructor(private active: ActivatedRoute, private deploymentService: DeploymentsService, private router: Router,
    private toaster: ToastrService
  ) {}

  ngOnInit() {
    this.active.queryParams.subscribe(params => {
      if(params['error'] === "access_denied"){
        this.authorizationCode = '';
        this.router.navigate(['/deployment']);
        this.toaster.error('Access denied');
        return;
      }
      this.authorizationCode = params['code'];
    });
    // if (this.authorizationCode != '' && this.authorizationCode != undefined)
    //   this.deploymentService.getCallback(this.authorizationCode).subscribe((data: any) => {
    //     this.router.navigate(['/deployment']);
    //     this.toaster.success('Successfully authenticated');
    //   },
    //   err=>{console.log(err)
    //     this.router.navigate(['/deployment']);
    //     this.toaster.error('Error in authorization');
    //     })
  }
}
