import { Component, Output, EventEmitter, ViewEncapsulation, OnInit, Input } from '@angular/core';
import { DeploymentsService } from '../deployments/deployment.service';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { SharedService } from '../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { WebsocketService } from '../../core/services/websocket.service';
@Component({
  selector: 'app-review-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-screen.component.html',
  styleUrl: './review-screen.component.scss',
  providers: [DeploymentsService],
  encapsulation: ViewEncapsulation.None
})
export class ReviewScreenComponent implements OnInit {

  review: any;
  @Input() generalDetails: any;
  @Input() envData: any;
  @Input() secretData: any;
  @Input() configFileData: any;
  @Output() editSelectedStep = new EventEmitter<{ step: number, fromReview: boolean }>();
  @Input() selectedRepoName: string = '';

  constructor(private deploymentsService: DeploymentsService, private router: Router,
    private location: Location, private shared: SharedService, private toaster: ToastrService,
    private websocketService: WebsocketService) { }

  ngOnInit() {
    console.log(this.generalDetails)
    console.log(this.configFileData)
  }

  goBack() {
    this.location.back();
  }

  submitChanges() {
    // const environment = this.shared.getCookie('environment');
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;
    console.log('EnvID data', envId);
    console.log('Reviewtype', this.review.stepOne.type);

    const {
      buildCommand,
      ephemeralStorage,
      healthEndpoint,
      instanceType,
      name,
      replicas,
      startCommand,
      installCommand,
      storage,
      type,
      port,
      zipFilename,
    } = this.review.stepOne;

    const req = {
      envId,
      name,
      type,
      repoUrl: this.review.repoUrl,
      branchName: this.review.stepOne.selectedBranch,
      replicas,
      instanceType: instanceType,
      buildCommand: buildCommand ?? null,
      startCommand: startCommand ?? null,
      installCommand: installCommand ?? null,
      healthEndpoint: healthEndpoint ?? null,
      storage,
      ephemeralStorage: ephemeralStorage ?? null,
      port,
      zipFileName: this.review.stepOne.zipFilename ?? null,
    };

    console.log('Request Data:', req);

    this.deploymentsService.createDeployement(req).subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success') {
          this.toaster.success(res?.message);
          // this.websocketService.sendMessage({ messages: 'new message' });
          this.router.navigate(['/deployment']);
        }
      },
      error: (err) => {
        this.toaster.error(err);
      }
    });
  }
  objectKeys(obj: object) {
    return Object.keys(obj);
  }
  edit(step: number) {
    this.editSelectedStep.emit({ step: step, fromReview: true })
  }

  getFileNameOnly(fullPath: string | undefined): string {
    if (!fullPath) return '';
    return fullPath.split('\\').pop() || '';
  }

  hasData(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }
}
