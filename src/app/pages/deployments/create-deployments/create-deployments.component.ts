import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { DeploymentOptions } from '../../../core/models/list-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DeploymentsService } from '../deployment.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SelectedRepoDetails } from '../../../core/models/deployment.model';
import {
  catchError,
  concatMap,
  debounceTime,
  finalize,
  of,
  tap,
} from 'rxjs';
import { EnvironmentVariablesComponent } from '../environment-variables/environment-variables.component';
import { DeploymentSecretsComponent } from '../deployment-secrets/deployment-secrets.component';
import { ReviewScreenComponent } from '../review-screen/review-screen.component';
import { environment } from '../../../../environments/environment';
import { ProjectsService } from '../../projects/projects.service';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { DEPLOY_OPTIONS, DEPLOYMENT_STEPS } from '../../../shared/constants/nimbuz.constant';
import { VALIDATION_REGEX } from '../../../core/constants/validation-regex.constant';
import { PermissionService } from '../../../shared/services/permission.service';
import { SharedService } from '../../../shared/services/shared.service';
@Component({
  selector: 'app-create-deployments',
  standalone: true,
  imports: [
    MatStepperModule,
    ModalComponent,
    EnvironmentVariablesComponent,
    DeploymentSecretsComponent,
    ReviewScreenComponent,
    SHARED_IMPORTS
  ],
  templateUrl: './create-deployments.component.html',
  styleUrl: './create-deployments.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [DeploymentsService],
})
export class CreateDeploymentsComponent implements OnInit, AfterViewInit {
  steps = DEPLOYMENT_STEPS;
  currentStep = 0;

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('zipDeploymentModel') public zipDeploymentModel!: ModalComponent;

  public zipDeploymentConfig: any = {
    modalTitle: 'Zip Deployment',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => false,
  };

  stepOneForm: FormGroup;
  repoListForm: FormGroup;

  deployOptions: DeploymentOptions[] = DEPLOY_OPTIONS
  selectedVCS: string = '';
  reposList: any;
  resources: any[] = [];
  selectedResource: any;
  fileUploadForm!: FormGroup;
  zipUploadForm!: FormGroup;

  fileError: string = '';
  fileExtension: string = '';
  selectedFile: File | null = null;
  selectedConfigFile: File | null = null;
  branches: any;
  selectedLabRepo: any;
  selectedHubRepo: any;
  selectedRepoDetails!: SelectedRepoDetails;

  envData: any;
  secretData: any;

  @ViewChild('envDetails') child!: EnvironmentVariablesComponent;
  @ViewChild('secretDetails') secretChild!: DeploymentSecretsComponent;

  fileName: string | null = null;
  selectedRepoName: string = '';

  ephemeralExhausted: boolean = false;
  currentProjectId: string = '';
  fileFormData: any;
  storageValidation: string = 'Enter in unit: Gi';
  commandValidation: string = 'Please provide the command which application you are deploying';
  deploymentNames: any = [];
  fromReview: boolean = false;
  parsedConfigData: any
  submitted: boolean = false
  vcsProfileInfo: any;

  constructor(
    private _fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deploymentsService: DeploymentsService,
    private toaster: ToastrService,
    private projectService: ProjectsService,
    public permissionService: PermissionService,
    private sharedService: SharedService,
    private cdr:ChangeDetectorRef
  ) {
    this.stepOneForm = this._fb.group({
      type: ['', Validators.required],
      selectedRepo: [null],
      branchName: [null],
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(VALIDATION_REGEX.APP_NAME),
          Validators.maxLength(50),
        ],
      ],
      replicas: ['1', [Validators.pattern('^[0-9]+$')]],
      instanceType: ['', Validators.required],
      buildCommand: [null, Validators.maxLength(60)],
      startCommand: [null, Validators.maxLength(60)],
      installCommand: [null],
      ephemeralStorage: ['2', Validators.pattern('^[0-9]*\\.?[0-9]+$')],
      storage: [null, Validators.pattern('^[0-9]+$')],
      healthEndpoint: [null, Validators.maxLength(250)],
      zipFilename: [{ value: null, disabled: true }],
      dockerfilePath: [null],
      port: ['', [Validators.maxLength(5), Validators.pattern('^[0-9]+$'),
      Validators.min(1), Validators.max(65535)
      ]],
    });
    this.repoListForm = this._fb.group({
      selectedRepo: ['', Validators.required],
    });
    this.fileUploadForm = this._fb.group({
      fileInput: [''],
      filePath: [''],
    });
    this.zipUploadForm = this._fb.group({
      zipfileInput: [''],
    });
  }

  ngOnInit(): void {
    this.currentProjectId = JSON.parse(localStorage.getItem('project') || '{}').id || '';
    if (this.currentProjectId) {
      this.projectService.getProjectDetailsById(this.currentProjectId).subscribe((res: any) => {
        this.vcsProfileInfo = {
          github: res.data.github,
          gitlab: res.data.gitlab
        }
      });
    }
    this.sharedService.currencyChange$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.stepOneForm
      .get('instanceType')
      ?.valueChanges.subscribe((selectedValue) => {
        this.selectedResource = selectedValue;
      });
    this.stepOneForm
      .get('selectedRepo')
      ?.valueChanges.subscribe((selectedValue) => {
        const repoDetails = this.reposList.find(
          (item: any) => item.id == selectedValue
        );
        this.selectedRepoDetails = this.selectedRepoDetails || {
          gitRepoId: null,
          repoUrl: null,
          branchName: '',
          webhook: false,
        };
        this.selectedRepoDetails.repoUrl =
          this.selectedVCS === 'gitlab'
            ? repoDetails.path_with_namespace
            : this.selectedVCS === 'github'
              ? repoDetails.full_name
              : null;
        this.selectedRepoDetails.gitRepoId = selectedValue?.toString();
        this.selectedRepoName = repoDetails?.name;
        this.selectedRepoDetails.webhook = repoDetails.webhook;
        this.stepOneForm.get('name')?.setValue(repoDetails.name.toLowerCase());
        this.checkAvailablity();
        this.selectedRepoBranch(repoDetails);
      });

    this.stepOneForm
      .get('name')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        const lowerCased = value?.toLowerCase() || '';
        if (value !== lowerCased) {
          this.stepOneForm
            .get('name')
            ?.setValue(lowerCased, { emitEvent: false });
          return;
        }
        this.stepOneForm.get('name')?.setValidators([
          Validators.required,
          Validators.maxLength(40),
          this.isNameAvailable(true),
          Validators.pattern(VALIDATION_REGEX.APP_NAME),
        ]);
        this.fileFormData?.set('appName', lowerCased);
        this.stepOneForm.markAllAsTouched();
      })
    this.stepOneForm.get('branchName')?.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.selectedRepoDetails.branchName = value;
    })

    this.deploymentsService.getInstanceTypes().subscribe((res: any) => {
      this.resources = res.data;
      const defaultResource = this.resources.find((r) => r.instanceType === 'femto.m');

      if (defaultResource) {
        this.stepOneForm.get('instanceType')?.setValue(defaultResource);
        this.selectedResource = defaultResource;
      }
    });
    this.deploymentNames = JSON.parse(localStorage.getItem('availableDeployments') || '[]');
  }
  ngAfterViewInit(): void {
    this.route.queryParams.subscribe((params) => {
      const provider = params['provider'];
      const code = params['code'];
      if (!provider || !code) {
        return;
      }
      this.selectedVCS = provider;
      this.stepOneForm.get('type')?.setValue(provider);
      this.deploymentsService.getVCSCallback(code, this.currentProjectId, provider).subscribe((res: any) => {
        if (res && res.status?.toLowerCase() === 'success') {
          this.fetchRepos(provider);
        }
      })
    });
  }

  // onInstanceTypeChange(): void {
  //   const selectedName = this.stepOneForm.get('instanceType')?.value;
  //   const selectedResource = selectedName;
  //   if (!selectedResource) return;
  //   this.selectedResource = selectedResource;
  // }
  private redirectToOAuth(provider: 'github' | 'gitlab') {
    const { clientId = '', redirectUri = '' } = environment[provider] || {};
    const state = {
      state: this.getState(),
      provider: provider
    }
    const scope = provider === 'gitlab' ? 'api' : 'repo,user,email';
    const baseUrl =
      provider === 'github'
        ? 'https://github.com/login/oauth/authorize'
        : 'https://gitlab.com/oauth/authorize';
    const authUrl = `${baseUrl}?client_id=${clientId}&redirect_uri=${redirectUri}` +
      `&response_type=code&state=${btoa(JSON.stringify(state))}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  }
  getState(): string {
    const subdomain = this.getSubdomain();
    const isIndividual = subdomain === 'app';
    return isIndividual ? 'nimbuz' : subdomain;
  }

  private getSubdomain(): string {
    const hostname = window.location.hostname;
    return hostname.split('.')[0];
  }

  submitChanges() {
    this.submitted = true;
    const filePath = this.fileUploadForm.get('filePath')?.value;
    const fileInput = this.fileUploadForm.get('fileInput')?.value;
    const fileName = fileInput ? fileInput.split('\\').pop() : null;

    const req = this.buildRequest(fileName, filePath);
    const payload = this.cleanPayload(req);
    let upload$: any = of(null);

    if (this.fileFormData) {
      upload$ = this.deploymentsService.getS3Details(this.fileExtension).pipe(
        concatMap((res: any) => {
          if (!res?.data) throw new Error('Failed to get S3 details');
          const s3Data = res.data;
          return this.deploymentsService.uploadFileToS3(s3Data.uploadUrl, this.selectedFile, s3Data.contentType).pipe(
            tap(() => {
              req.sourceCode.s3FileKey = s3Data.s3Key;
            })
          );
        })
      );
    }

    upload$
      .pipe(
        concatMap(() => this.deploymentsService.createDeployement(payload)),
        finalize(() => { }),
        catchError((err) => {
          console.error('Deployment Error:', err);
          this.toaster.error('Error during deployment process');
          return of(null);
        })
      )
      .subscribe((results: any) => {
        this.submitted = false;
        if (!results) return;
        this.toaster.success('Deployment created successfully');
        this.router.navigate(['/deployment']);
      });
  }
  isError(controlName: string, errorType: string): boolean {
    const control = this.stepOneForm.controls[controlName];
    return control.hasError(errorType) && control.touched;
  }

  fileValidator(allowedExtensions: string[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;
      if (!file) {
        return null;
      }
      const extension = file.split('.').pop()?.toLowerCase();
      const isValidExtension = allowedExtensions.includes(extension!);
      if (!isValidExtension) {
        return { invalidFileType: true };
      }
      if (file.size > 500_000_000) {
        return { fileSizeExceeded: true };
      }
      return null;
    };
  }

  onZipUpload(): void {
    if (this.zipUploadForm.invalid) {
      this.fileError = 'Please select a valid file to upload.';
    }
    else {
      const environment = localStorage.getItem('environment');
      const envId = environment ? JSON.parse(environment).id : null;
      if (this.selectedFile && this.fileExtension && envId) {
        const formData = new FormData();
        if (this.selectedFile) {
          formData.append('file', this.selectedFile, this.selectedFile.name);
          formData.append('appName', this.stepOneForm.get('name')?.value);
        }
        formData.append('type', 'ZIP');
        this.fileFormData = formData;
        this.stepOneForm
          .get('zipFilename')
          ?.patchValue(this.selectedFile?.name);
        this.checkAvailablity();
        this.zipDeploymentModel.dismiss();
      }
    }
  }

  onZipFileSelect(event: any): void {
    const file = event.target.files[0];
    const zipfileinput = this.zipUploadForm.get('zipfileInput');
    const allowedExtensions = ['zip', 'tar', 'rar'];
    zipfileinput?.setValidators([
      Validators.required,
      this.fileValidator(allowedExtensions),
    ]);
    zipfileinput?.updateValueAndValidity();
    const zipfileInputControl = this.zipUploadForm.get('zipfileinput');
    if (file) {
      this.selectedFile = file;
      if (file.size > 500_000_000) {
        this.toaster.error('File size too large.');
        this.fileError = 'File size large';
      } else {
        if (!zipfileInputControl?.errors?.['invalidFileType']) {
          this.stepOneForm.get('zipFilename')?.patchValue(file.name);
          const fileNameWithoutExtension = this.removeFileExtension(file.name);
          this.stepOneForm.get('name')?.patchValue(fileNameWithoutExtension);
          this.fileError = '';
        } else {
          this.fileError = 'Please upload valid file type';
        }
      }
    }
  }

  removeFileExtension(fileName: string): string {
    const fileNameParts = fileName.split('.');
    if (fileNameParts.length > 1) {
      this.fileExtension = fileNameParts.pop()!;
    }
    return fileNameParts.join('.');
  }

  selectedRepoBranch(event: any) {
    if (!this.selectedVCS) {
      return;
    }
    const vcs = this.selectedVCS;
    let repoIdOrName: string | number;
    if (vcs === 'gitlab') {
      this.selectedLabRepo = event;
      repoIdOrName = this.selectedLabRepo?.id;
    } else {
      this.selectedHubRepo = event;
      const repo = this.reposList.find((r: any) => r.id == this.selectedHubRepo?.id);
      if (!repo) {
        console.error('Selected GitHub repo not found.');
        return;
      }
      repoIdOrName = repo.full_name;
    }
    if (!repoIdOrName) {
      console.warn('No valid repository selected.');
      return;
    }
    this.deploymentsService
      .getAvailableBranches(this.currentProjectId, vcs, repoIdOrName)
      .subscribe({
        next: (res: any) => {
          const branches = res?.data ?? [];
          this.branches = branches;
          const firstBranch = branches?.[0] ?? null;
          if (firstBranch) {
            this.stepOneForm.get('branchName')?.setValue(firstBranch);
            this.selectedRepoDetails.branchName = firstBranch;
          } else {
            this.stepOneForm.get('branchName')?.reset();
          }
        },
        error: (err) => {
          this.toaster?.error(`Failed to fetch branches from ${vcs}`);
        }
      });
  }

  goToStep(index: number) {
    this.currentStep = index;
  }

  next(label: string) {
    const labels = label;
    if (labels === 'Submit') {
      this.submitChanges();
      return;
    }
    if (this.fromReview) {
      this.currentStep = 4;
      return;
    }
    switch (this.currentStep) {
      case 1:
        this.child.addVariable();
        break;
      case 2:
        this.secretChild.addSecret();
        break;
      case 3:
        if (this.fileUploadForm.invalid) {
          this.fileUploadForm.markAllAsTouched();
          return;
        }
        break;
      case 4:
        this.submitChanges();
        return;
    }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  selectedType(option: any) {
    // this.stepOneForm.get('dockerfilePath')?.setValidators(null);
    //     this.stepOneForm.get('dockerfilePath')?.updateValueAndValidity();
    this.selectedVCS = option.value;
    const handlers: any = {
      github: () => this.handleVCS('github'),
      gitlab: () => this.handleVCS('gitlab'),
      zip: () => {
        this.zipDeploymentModel.open();
        this.zipUploadForm.reset();
      },
      // docker: () => {
      //   this.stepOneForm.get('dockerfilePath')?.setValidators([Validators.required, Validators.maxLength(250)]);
      //   this.stepOneForm.get('dockerfilePath')?.updateValueAndValidity();
      // }
    };

    handlers[this.selectedVCS]?.();
  }

  handleVCS(type: 'github' | 'gitlab') {
    const isAuthenticated = this.vcsProfileInfo?.[type];

    if (isAuthenticated) {
      this.fetchRepos(type);
    } else {
      this.redirectToOAuth(type);
    }
  }
  private fetchRepos(type: 'github' | 'gitlab') {
    this.deploymentsService.getAvailableRepos(type, this.currentProjectId).subscribe({
      next: (data: any) => {
        if (data.status?.toLowerCase() === 'success') {
          this.reposList = this.normalizeRepos(type, data.data);

          if (this.reposList.length > 0) {
            this.stepOneForm.get('selectedRepo')?.setValue(this.reposList[0].id);
          }
        } else {
          this.reposList = [];
        }
      },
      error: (err) => {
        this.toaster.error('Error in getting user repository');
        this.reposList = [];
      }
    });
  }
  private normalizeRepos(type: 'github' | 'gitlab', repos: any[]) {
    return repos.map((repo: any) => ({
      ...repo,
      webhook:
        type === 'github'
          ? repo.webhook || false
          : repo.permission || false
    }));
  }
  canNavigateToStep(index: number): boolean {
    if (index <= this.currentStep) return true;
    if (this.currentStep === 0 && this.stepOneForm.invalid) return false;
    return true;
  }

  getenvironmentList(event: any) {
    this.envData = event;
  }
  getSecretList(event: any) {
    this.secretData = event;
  }
  isStepCompleted(index: number): boolean {
    switch (index) {
      case 0:
        return this.stepOneForm.valid;
      case 1:
        return true;
      case 2:
        return true;
      default:
        return false;
    }
  }
  checkAvailablity() {
    if (this.stepOneForm.get('name')?.invalid) {
      this.stepOneForm.markAllAsTouched();
      return;
    }

    const enteredName = this.stepOneForm.get('name')?.value;
    const nameExists = this.deploymentNames.some((name: any) => name === enteredName);
    if (nameExists) {
      this.stepOneForm
        .get('name')
        ?.setValidators(this.isNameAvailable(false));
      this.stepOneForm.get('name')?.updateValueAndValidity();
    } else {
      this.stepOneForm
        .get('name')
        ?.setValidators(this.isNameAvailable(true));
      this.stepOneForm.get('name')?.updateValueAndValidity();
    }
  }
  isNameAvailable(valid: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      return valid
        ? null
        : {
          nameValidation:
            'Name must contain only letters, numbers and hyphens',
        };
    };
  }

  editSelectedStep(event: { step: number, fromReview: boolean }) {
    this.fromReview = event.fromReview;
    this.currentStep = event.step;
  }

  cleanPayload(obj: any): any {
    return Object.entries(obj)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  }

  clearFile() {
    this.selectedConfigFile = null;
    ['fileInput', 'filePath'].forEach((controlName) => {
      const control = this.fileUploadForm.get(controlName);
      if (control) {
        control.reset();
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });

    const fileInputElement = document.getElementById(
      'fileInput'
    ) as HTMLInputElement | null;
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }
  checkFileAvailble() {
    const fileInput = this.fileUploadForm.get('fileInput');
    const filePath = this.fileUploadForm.get('filePath');
    if (filePath?.value && !fileInput?.value) {
      fileInput?.setValidators([Validators.required]);
      fileInput?.updateValueAndValidity();
      this.fileUploadForm.markAllAsTouched();
      return;
    }
    fileInput?.clearValidators();
    fileInput?.updateValueAndValidity();
  }
  private buildGitUrl(): string {
    const repo = this.selectedRepoDetails?.repoUrl;
    const branch = this.selectedRepoDetails?.branchName;

    if (this.selectedVCS === 'github') {
      return `https://token@github.com/${repo}.git -b ${branch}`;
    }
    if (this.selectedVCS === 'gitlab') {
      return `https://${repo}:token@gitlab.com/${repo}.git -b ${branch}`;
    }
    return '';
  }

  private buildRequest(fileName: string | null, filePath: string | null): any {
    const secretObj = this.secretData?.data?.reduce((acc: any, item: any) => {
      acc[item.EnvVariable] = item.Value;
      return acc;
    }, {});

    const ephemeralStorage = this.stepOneForm.value.ephemeralStorage
      ? `${this.stepOneForm.value.ephemeralStorage}Gi`
      : null;

    return {
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      name: this.stepOneForm.getRawValue().name,
      sourceCode: {
        type: this.selectedVCS === 'zip' ? 'file' : 'vcs',
        gitUrl: this.buildGitUrl(),
        s3FileKey: null,
        dockerfilePath: this.stepOneForm.value.dockerfilePath || null,
      },
      application: {
        replicas: this.stepOneForm.value.replicas || 0,
        instanceType: this.stepOneForm.value.instanceType?.instanceType,
        installCommand: this.stepOneForm.value.installCommand,
        buildCommand: this.stepOneForm.value.buildCommand,
        startCommand: this.stepOneForm.value.startCommand,
        ephemeralStorage,
        storage: this.stepOneForm.value.storage
          ? `${this.stepOneForm.value.storage}Gi`
          : null,
      },
      network: {
        port: this.stepOneForm.value.port ? Number(this.stepOneForm.value.port) : 80,
        healthEndpoint: this.stepOneForm.value.healthEndpoint || null,
        isCustomDns: false,
        appIngressDomain: null,
        customDomain: null,
      },
      config: {
        name: fileName ? fileName.replace(/\.[^/.]+$/, '') : null,
        path: filePath || null,
        data: this.parsedConfigData || null,
      },
      secret: secretObj || null,
      environment: this.envData?.data || null
    };
  }
  onFileSelected(event: Event) {
    const filePath = this.fileUploadForm.get('filePath');
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const base64String = fileReader.result as string;

      const pureBase64 = base64String.split(',')[1];
      this.parsedConfigData = pureBase64;

    };
    filePath?.setValidators([Validators.required]);
    filePath?.updateValueAndValidity();

    fileReader.readAsDataURL(file);
  }
  formatCurrency(value: number | undefined, fromCurrency?: string): string {
    if (value == null || isNaN(Number(value))) return '';
    const target = this.sharedService.getCurrency() || 'USD';
    const converted = this.sharedService.convertAmount(Number(value), fromCurrency, target);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: target,
        minimumFractionDigits: 2,
      }).format(converted);
    } catch (e) {
      return String(converted);
    }
  }
}
