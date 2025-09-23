import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeploymentOptions } from '../../../core/models/list-item.model';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../../shared/services/shared.service';
import { DeploymentsService } from '../deployment.service';
import { ModalComponent } from '../../../shared/components/model/model.component';
import { SelectedRepoDetails } from '../../../core/models/deployment.model';
import { WebsocketService } from '../../../core/services/websocket.service';
import {
  catchError,
  debounceTime,
  forkJoin,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { EnvironmentVariablesComponent } from '../environment-variables/environment-variables.component';
import { DeploymentSecretsComponent } from '../deployment-secrets/deployment-secrets.component';
import { ReviewScreenComponent } from '../../review-screen/review-screen.component';
import { TooltipDirective } from '@coreui/angular';
import { environment } from '../../../../environments/environment';
// import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-create-deployments',
  standalone: true,
  imports: [
    MatStepperModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    ModalComponent,
    EnvironmentVariablesComponent,
    DeploymentSecretsComponent,
    ReviewScreenComponent,
    TooltipDirective,
  ],
  templateUrl: './create-deployments.component.html',
  styleUrl: './create-deployments.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [DeploymentsService, WebsocketService],
})
export class CreateDeploymentsComponent
  implements OnInit, AfterViewInit, OnDestroy {
  steps = [
    { label: 'General' },
    { label: 'Environment variable' },
    { label: 'Secrets' },
    { label: 'Config as file' },
    { label: 'Review' },
  ];

  currentStep = 0;

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('deployTypeSelect') deployTypeSelect!: MatSelect;
  @ViewChild('repoSelect') repoSelect!: MatSelect;
  @ViewChild('zipDeploymentModel') public zipDeploymentModel!: ModalComponent;

  public zipDeploymentConfig: any = {
    modalTitle: 'Zip Deployment',
    width: '500px',
    height: '1500px',
    hideDismissButton: () => true,
    hideCloseButton: () => false,
  };

  stepOneForm: FormGroup;
  // configForm: FormGroup;
  repoListForm: FormGroup;
  // branchListForm: FormGroup;

  deployOptions: DeploymentOptions[] = [
    {
      icon: 'bi-github',
      name: 'Deploy from GitHub repo',
      color: '#000',
      value: 'github',
    },
    {
      icon: 'bi-gitlab',
      name: 'Deploy from GitLab repo',
      color: 'orange',
      value: 'gitlab',
    },
    { icon: 'bi-file-zip', name: 'Deploy zip/tar', color: 'red', value: 'zip' },
  ];
  filteredOptions!: any;
  selectedDeployType!: DeploymentOptions;
  githubAuthenticated: boolean = false;
  gitLabAuthenticated: boolean = false;
  isTypeSelected: boolean = false;
  selectedVCS: string = '';
  reposList: any;
  resources: any[] = [];
  selectedResource: any;
  fileUploadForm!: FormGroup;
  zipUploadForm!: FormGroup;
  allowedFileTypes: string[] = ['.zip', '.tar'];
  fileError: string = '';
  fileExtension: string = '';
  selectedFile: File | null = null;
  selectedConfigFile: File | null = null;
  branches: any;
  githubRepos: any;
  selectedLabRepo: any;
  selectedHubRepo: any;
  githubRepoDetails: any;
  selectedRepoDetails!: SelectedRepoDetails;
  provider: any;
  messages: any[] = [];
  private wsSubscription!: Subscription;
  environmentChanges: boolean = false;
  secretsChanges: boolean = false;
  envData: any;
  secretData: any;
  loading: boolean = false;
  @ViewChild('envDetails') child!: EnvironmentVariablesComponent;
  @ViewChild('secretDetails') secretChild!: DeploymentSecretsComponent;
  configFileData: any;
  fileName: string | null = null;
  selectedRepoName: string = '';
  cpuQuota: any = 0;
  ramQuota: any = 0;
  ephemeralQuota: any = 0;
  ephemeralExhausted: boolean = false;
  cpuExhausted: boolean = false;
  ramExhausted: boolean = false;
  currentProjectId: string = '';
  fileFormData: any;
  storageValidation: string = 'Enter in unit: Gi';
  commandValidation: string = 'Please provide the command which application you are deploying';
  deploymentNames: any = [];
  fromReview: boolean = false;

  constructor(
    private _fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deploymentsService: DeploymentsService,
    private toaster: ToastrService,
    private shared: SharedService,
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.stepOneForm = this._fb.group({
      type: ['', Validators.required],
      selectedRepo: [null],
      branchName: [null],
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?!.*[.-]{2,})(?!.*[A-Z])(?!.*_)[a-z0-9]+([.-]?[a-z0-9]+)*$/
          ),
          Validators.maxLength(50),
        ],
      ],
      replicas: ['', [Validators.pattern('^[0-9]+$')]],
      instanceType: ['', Validators.required],
      buildCommand: [null, Validators.maxLength(60)],
      startCommand: [null, Validators.maxLength(60)],
      installCommand: [null],
      ephemeralStorage: ['2', Validators.pattern('^[0-9]*\\.?[0-9]+$')],
      storage: [null, Validators.pattern('^[0-9]+$')],
      healthEndpoint: [null, Validators.maxLength(250)],
      zipFilename: [{ value: null, disabled: true }],
      port: ['', [Validators.maxLength(5), Validators.pattern('^[0-9]+$')]],
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

    // this.wsSubscription = this.websocketService.getMessages().subscribe({
    //   next: (message) => {
    //     this.messages.push(message);
    //   },
    //   error: (err: any) => console.error('WebSocket error:', err),
    //   complete: () => console.log('WebSocket connection closed')
    // });

    this.deploymentsService.getDefualtConfigInfo().subscribe((res: any) => {
      this.stepOneForm.get('replicas')?.setValue(res.data?.replicas);
    });

    this.stepOneForm
      .get('instanceType')
      ?.valueChanges.subscribe((selectedValue) => {
        this.selectedResource = this.resources.find(
          (resource) => resource.name === selectedValue
        );
      });
    this.stepOneForm
      .get('selectedRepo')
      ?.valueChanges.subscribe((selectedValue) => {
        console.log('Selected Repo:', selectedValue);
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
          Validators.pattern(/^(?!.*[.-]{2,})(?!.*[A-Z])(?!.*_)[a-z0-9]+([.-]?[a-z0-9]+)*$/)
        ]);
        this.fileFormData.set('appName', lowerCased);
        this.stepOneForm.markAllAsTouched();
      })
    this.stepOneForm.get('branchName')?.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.selectedRepoDetails.branchName = value;
    })

    this.deploymentsService.getInstanceTypes().subscribe((res: any) => {
      this.resources = Object.entries(res.data).map(([key, value]) => ({
        name: key.trim(),
        ...(value as object),
      }));
      const defaultResource = this.resources.find((r) => r.name === 'femto.m');

      if (defaultResource) {
        this.stepOneForm.get('instanceType')?.setValue(defaultResource.name);
        this.selectedResource = defaultResource;
      }
    });
    const resourceUsage = JSON.parse(localStorage.getItem('resourceUsage') || '[]');
    const cpuResource = resourceUsage.find(
      (res: any) => res.resource_type === 'CPU'
    );
    const ramResource = resourceUsage.find(
      (res: any) => res.resource_type === 'RAM'
    );
    const ephemeralResource = resourceUsage.find(
      (res: any) => res.resource_type === 'ephemeral_storage'
    );

    this.cpuQuota = cpuResource;
    this.ramQuota = ramResource;
    this.ephemeralQuota = ephemeralResource;


    const availableDeplyements = JSON.parse(localStorage.getItem('availableDeplyements') || '[]');
    if (availableDeplyements) {
      this.deploymentNames = availableDeplyements.map((item: any) => item.name);
    }

  }
  ngAfterViewInit(): void {
    this.route.queryParams.subscribe((params) => {
      const provider = params['provider'];
      const code = params['code'];
      this.selectedVCS = provider;
      if (code) {
        if (provider === 'github') {
          this.selectedVCS = 'github';
          this.stepOneForm.get('type')?.setValue('github');

          this.deploymentsService.getVCSCallback(code, this.currentProjectId, provider).subscribe((res: any) => {
            if (res && res.status?.toLowerCase() === 'success') {
              this.getGitHubRepos();
            }
          })
        } else {
          this.selectedVCS = 'gitlab';
          this.stepOneForm.get('type')?.setValue('gitlab');
          this.deploymentsService.getVCSCallback(code, this.currentProjectId, provider).subscribe((res: any) => {
            if (res && res.status?.toLowerCase() === 'success') {
              this.getGitLabRepos();
            }
          })
        }
      }
    });
  }

  onEphemeralMouseOut() {
    const value = this.stepOneForm.get('ephemeralStorage')?.value;
    const ephemeralStorage = parseFloat(value.replace(/[^\d.]/g, ''));
    if (ephemeralStorage > this.ephemeralQuota?.remaining) {
      this.ephemeralExhausted = true;
      this.stepOneForm.setErrors({ invalid: true });
    } else {
      this.ephemeralExhausted = false;
      this.stepOneForm.setErrors(null);
    }
  }

  onInstanceTypeChange(): void {
    const selectedName = this.stepOneForm.get('instanceType')?.value;

    const selectedResource = this.resources.find(
      (r) => r.name === selectedName
    );

    if (!selectedResource) return;

    this.selectedResource = selectedResource;
    // CPU conversion from m to core
    let selectedCPU = 0;
    if (selectedResource.cpu.endsWith('m')) {
      selectedCPU = parseFloat(selectedResource.cpu.replace('m', '')) / 1000;
    } else {
      selectedCPU = parseFloat(selectedResource.cpu);
    }

    // Memory Conversion from mi/gi to GB
    let selectedRAM = 0;
    if (selectedResource.memory.toLowerCase().endsWith('gi')) {
      selectedRAM = parseFloat(selectedResource.memory);
    } else if (selectedResource.memory.toLowerCase().endsWith('mi')) {
      selectedRAM = parseFloat(selectedResource.memory) / 1024;
    }
    // Calculate remaining values
    if (selectedCPU > this.cpuQuota?.remaining) {
      this.cpuExhausted = true;
      this.stepOneForm.setErrors({ invalid: true });
    } else {
      this.cpuExhausted = false;
      this.stepOneForm.setErrors(null);
    }
    if (selectedRAM > this.ramQuota?.remaining) {
      this.ramExhausted = true;
      this.stepOneForm.setErrors({ invalid: true });
    } else {
      this.ramExhausted = false;
      this.stepOneForm.setErrors(null);
    }
  }

  connectWithVCS(stepper: MatStepper) {
    this.reposList = [];
    this.isTypeSelected = true;
    this.selectedVCS = this.stepOneForm.value.type;
    if (this.selectedVCS === 'github') {
      if (this.githubAuthenticated) {
        this.getGitHubRepos();
        stepper.next();
      } else {
        this.redirectToOAuth('github');
      }
    } else if (this.selectedVCS === 'gitlab') {
      if (this.gitLabAuthenticated) {
        this.getGitLabRepos();
        stepper.next();
      } else {
        this.redirectToOAuth('gitlab');
      }
    } else if (this.selectedVCS === 'zip') {
      this.zipDeploymentModel.open();
      this.zipUploadForm.reset();
    }
  }

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
    // console.log(authUrl);
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

  getGitHubRepos() {
    this.deploymentsService.getAvailableRepos('github', this.currentProjectId).subscribe({
      next: (data: any) => {
        this.githubRepos = data;

        if (data.status?.toLowerCase() === 'success') {
          this.reposList = data.data;

          this.reposList = this.reposList.map((repo: any) => ({
            ...repo,
            webhook: repo.webhook || false,
          }));
          this.stepOneForm.get('selectedRepo')?.setValue(this.reposList[0].id);
          // this.cdr.detectChanges()
        } else {
          this.reposList = [];
        }
      },
      error: (err) => {
        console.error('Error fetching repositories:', err);
        this.reposList = [];
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
  getGitLabRepos() {
    this.deploymentsService.getAvailableRepos('gitlab', this.currentProjectId).subscribe(
      (data: any) => {
        if (data.status?.toLowerCase() === 'success') {
          this.reposList = data.data.map((repo: any) => ({
            ...repo,
            webhook: repo.permission || false,
          }));
          this.stepOneForm.get('selectedRepo')?.setValue(this.reposList[0].id);
        }

        // if (Array.isArray(data)) {
        //   this.reposList = data
        //     .filter((repo: any) => {
        //       const accessLevel =
        //         repo.permissions?.group_access?.access_level ||
        //         repo.permissions?.project_access?.access_level;
        //       return accessLevel === 40 || accessLevel === 50;
        //     })
        //     .map((repo: any) => ({
        //       ...repo,
        //       webhook: true,
        //     }));
        // } else if (data.status?.toLowerCase() === 'success') {
        //   this.reposList = (data.data || []).map((repo: any) => {
        //     const accessLevel =
        //       repo.permissions?.group_access?.access_level ||
        //       repo.permissions?.project_access?.access_level;
        //     const hasAccess = accessLevel === 40 || accessLevel === 50;

        //     return {
        //       ...repo,
        //       webhook: hasAccess,
        //     };
        //   });
        //   this.stepOneForm.get('selectedRepo')?.setValue(this.reposList[0].id);
        // }
        else {
          this.reposList = [];
        }

      },
      (err) => {
        console.error('Error fetching GitLab repos:', err);
        this.toaster.error('Error in getting user repository');
        this.reposList = [];
      }
    );
  }

  getUserProfile() {
    const profileInfo = JSON.parse(localStorage.getItem('vcsProfileInfo') || '{}');
    if (profileInfo.github) {
      this.githubAuthenticated = true;
      this.getGitHubRepos();
    } else {
      this.githubAuthenticated = false;
      this.redirectToOAuth('github');
    }
  }
  getGitLabUserProfile() {
    const profileInfo = JSON.parse(localStorage.getItem('vcsProfileInfo') || '{}');
    if (profileInfo.gitlab) {
      this.gitLabAuthenticated = true;
      this.getGitLabRepos();
    } else {
      this.gitLabAuthenticated = false;
      this.redirectToOAuth('gitlab');
    }

  }
  submitChanges() {
    const filePathControl = this.fileUploadForm.get('filePath')?.value;
    const fileInputControl = this.fileUploadForm.get('fileInput')?.value;
    const fileName = fileInputControl
      ? fileInputControl.split('\\').pop()
      : null;
    const formData = new FormData();
    if (filePathControl && fileName && this.selectedConfigFile) {
      formData.append('file', this.selectedConfigFile, fileName);
      formData.append('configFilePath', filePathControl);
      formData.append('name', this.stepOneForm.value.name);
    }
    const ephemeralStorage = this.stepOneForm.value.ephemeralStorage
      ? `${this.stepOneForm.value.ephemeralStorage}Gi`
      : null;

    const req = {
      environmentId: JSON.parse(localStorage.getItem('environment') || '{}').id,
      name: this.stepOneForm.getRawValue().name,
      sourceCode: {
        type: this.selectedVCS == 'zip' ? 'zip' : 'VCS',
        gitUrl: this.selectedVCS == 'zip' ? null : this.selectedRepoDetails.repoUrl,
        s3FileKey: this.selectedVCS == 'zip' ? this.stepOneForm.getRawValue().zipFilename : null,
      },
      application: {
        replicas: this.stepOneForm.value.replicas || 0,
        instanceType: this.stepOneForm.value.instanceType,
        installCommand: this.stepOneForm.value.installCommand,
        buildCommand: this.stepOneForm.value.buildCommand,
        startCommand: this.stepOneForm.value.startCommand,
        ephemeralStorage: ephemeralStorage,
        storage: this.stepOneForm.value.storage
          ? `${this.stepOneForm.value.storage}Gi`
          : null,
      },
      network: {
        port:
          this.stepOneForm.value.port == ''
            ? null
            : Number(this.stepOneForm.value.port),
        healthEndpoint: this.stepOneForm.value.healthEndpoint || null,
        isCustomDns: false,
        appIngressDomain: null,
        customDomain: null,

      },
      config: {
        name: fileName ? fileName?.replace(/\.[^/.]+$/, '') : null,
        path: filePathControl ? filePathControl : null,
        data: null,
      }
    };
    const payload = this.cleanPayload(req);
    // const envId = JSON.parse(this.shared.getCookie('environment')).id;
    const envId = JSON.parse(localStorage.getItem('environment') || '{}').id || '';

    const zipUpload$ = this.fileFormData
      ? this.deploymentsService
        .uploadZipDeployment(envId, this.fileFormData)
        .pipe(
          tap((res: any) => {
            if (res.status === 'Success') {
              this.toaster.success('Deployment created successfully');
            } else {
              throw new Error('Zip upload failed');
            }
          })
        )
      : of(null);

    zipUpload$
      .pipe(
        switchMap(() => this.deploymentsService.createDeployement(payload)),
        switchMap(() => {
          const configData$ =
            this.envData && Object.keys(this.envData.data || {}).length
              ? this.deploymentsService.createConfigdata(envId, this.envData)
              : of(null);

          const secretsData$ =
            this.secretData && Object.keys(this.secretData.data || {}).length
              ? this.deploymentsService.createSecretsdata(
                envId,
                this.secretData
              )
              : of(null);

          const configFile$ =
            filePathControl && fileName
              ? this.deploymentsService.uploadConfigFile(envId, formData)
              : of(null);

          return forkJoin([configData$, secretsData$, configFile$]);
        })
      )
      .subscribe({
        next: ([res2, res3, res4]) => {
          this.router.navigate(['/deployment']);
        },
        error: (err) => {
          if (err instanceof Error) {
            console.error('Error message:', err.message);
            console.error('Stack trace:', err.stack);
          } else {
            console.error('Error:', JSON.stringify(err, null, 2));
          }
          this.toaster.error('Error during deployment process');
        },
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
      // const environment = this.shared.getCookie('environment');
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

  onFileSelect(event: Event, type: string): void {
    const fileInput = this.fileUploadForm.get('fileInput');
    const filePath = this.fileUploadForm.get('filePath');
    const allowedExtensions = ['json', 'yml', 'yaml'];
    fileInput?.setValidators([
      Validators.required,
      this.fileValidator(allowedExtensions),
    ]);
    fileInput?.updateValueAndValidity();
    filePath?.setValidators([Validators.required]);
    filePath?.updateValueAndValidity();

    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) return;
    this.selectedConfigFile = file;
    if (file.size > 100_000_000) {
      this.toaster.error('File size too large.');
      this.fileError = 'File size large';
      return;
    }
    this.fileUploadForm.get('fileInput')?.setValue(file.name);
    this.fileName = file.name;
    this.fileError = '';
  }

  onZipFileSelect(event: any): void {
    const file = event.target.files[0];
    const zipfileinput = this.zipUploadForm.get('zipfileInput');
    const allowedExtensions = ['zip', 'tar'];
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
    if (this.selectedVCS === 'gitlab') {
      this.selectedLabRepo = event;
      console.log('Selected Lab Repo:', this.selectedLabRepo);
      this.deploymentsService
        .getAvailableBranches(this.currentProjectId, 'gitlab', this.selectedLabRepo?.id)
        .subscribe((branchDetails: any) => {
          this.branches = branchDetails.data;
          this.stepOneForm.get('branchName')?.setValue(this.branches[0]);
          this.selectedRepoDetails.branchName = this.branches[0];
        });
    } else if (this.selectedVCS === 'github') {
      this.selectedHubRepo = event;
      this.githubRepoDetails = this.githubRepos.data.find(
        (repo: any) => this.selectedHubRepo?.id == repo.id
      );
      if (this.githubRepoDetails) {
        this.deploymentsService
          .getAvailableBranches(
            this.currentProjectId,
            'github',
            this.githubRepoDetails.full_name,

          )
          .subscribe((hubBranch: any) => {
            this.branches = hubBranch.data;
            this.stepOneForm.get('branchName')?.setValue(this.branches[0]);
            this.selectedRepoDetails.branchName = this.branches[0];
          });
      } else {
        console.error('Selected Repository not found in the list.');
      }
    }
  }
  // goToConfigTab(event: any) {
  //   this.selectedRepoDetails = this.selectedRepoDetails || { repoUrl: null, branchName: '' };
  //   this.selectedRepoDetails.branchName = event.value;
  // }
  ngOnDestroy() {
    // this.wsSubscription.unsubscribe();
    // this.websocketService.closeConnection();
    console.log('closed');
  }

  goToStep(index: number) {
    this.currentStep = index;
  }

  next(label: string) {
    // this.reviewOpen();
    const labels = label;
    if (labels === 'Submit') {
      this.submitChanges();
      return;
    }

    if (this.fromReview) {
      this.currentStep = 4;
      return;
    }

    if (this.currentStep === 1) {
      this.child.addVariable();
      // const childArray = this.child.envList;
    }
    if (this.currentStep === 2) {
      this.secretChild.addSecret();
      // const childArray = this.child.envList;
    }
    if (this.fileUploadForm.invalid && this.currentStep === 3) {
      this.fileUploadForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 4) {
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
    this.selectedVCS = option.value;
    // this.reposList = [];
    this.isTypeSelected = true;
    if (this.selectedVCS === 'github') {
      this.getUserProfile();
    } else if (this.selectedVCS === 'gitlab') {
      this.getGitLabUserProfile();
    } else if (this.selectedVCS === 'zip') {
      this.zipDeploymentModel.open();
      this.zipUploadForm.reset();
    }
  }
  reviewOpen() {
    //this.router.navigate(['/review-screen']);
    const reviewForm = {
      stepOne: this.stepOneForm.value,
      repoUrl: this.selectedRepoDetails?.repoUrl ?? null,
    };
  }
  canNavigateToStep(index: number): boolean {
    if (index <= this.currentStep) return true;
    if (this.currentStep === 0 && this.stepOneForm.invalid) return false;
    return true;
  }

  getenvironmentList(event: any) {
    // this.environmentChanges = event;
    this.envData = event;
  }
  getSecretList(event: any) {
    // this.environmentChanges = event;
    this.secretData = event;
  }
  isStepCompleted(index: number): boolean {
    switch (index) {
      case 0:
        return this.stepOneForm.valid;
      case 1:
        return true;
      // return this.environmentChanges === true;
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
}
