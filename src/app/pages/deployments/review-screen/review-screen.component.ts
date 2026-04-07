import { Component, Output, EventEmitter, ViewEncapsulation, OnInit, Input } from '@angular/core';
import { DeploymentsService } from '../deployment.service';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { SharedService } from '../../../shared/services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '../../../shared/services/permission.service';
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
  @Input() isAutoScaleEnabled: boolean = false;

  constructor(private deploymentsService: DeploymentsService, private router: Router,
    private location: Location, private shared: SharedService, private toaster: ToastrService,
    public permissionService: PermissionService) { }

  ngOnInit() {
    // console.log('ReviewScreenComponent')
  }

  goBack() {
    this.location.back();
  }

  submitChanges() {
    // const environment = this.shared.getCookie('environment');
    const environment = localStorage.getItem('environment');
    const envId = environment ? JSON.parse(environment).id : null;

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


    this.deploymentsService.createDeployement(req).subscribe({
      next: (res: any) => {
        if (res.status?.toLowerCase() === 'success') {
          this.toaster.success(res?.message);
          // this.websocketService.sendMessage({ messages: 'new message' });
          this.router.navigate(['/applications']);
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

  getFileType(filePath: string | undefined): string {
    if (!filePath) return '';
    const extension = filePath.split('.').pop()?.toUpperCase() || '';
    return extension;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 10) / 10 + ' ' + sizes[i];
  }

  getFileTimeAgo(uploadDate: Date | string | undefined): string {
    if (!uploadDate) return '';
    const date = typeof uploadDate === 'string' ? new Date(uploadDate) : uploadDate;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  hasData(obj: any): boolean {
    if (!obj) return false;
    if (Array.isArray(obj)) {
      return obj.length > 0;
    }
    return Object.values(obj).some(v => v !== null && v !== '');
  }
}
