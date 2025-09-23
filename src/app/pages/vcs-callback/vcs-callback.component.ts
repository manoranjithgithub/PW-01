import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProjectsService } from '../projects/projects.service';

@Component({
  selector: 'app-vcs-callback',
  template: '',
  standalone: true,
})
export class VcsCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private projectService: ProjectsService) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      const state = params['state'];
      if (!state) {
        this.router.navigate(['/page404']);
        return;
      }

      const projectId = JSON.parse(localStorage.getItem('project') || '{}').id || '';
      if (projectId) {
        this.projectService.getProjectDetailsById(projectId).subscribe((res: any) => {
          const vcsProfileInfo = {
            github: res.data.github,
            gitlab: res.data.gitlab
          }
          localStorage.setItem('vcsProfileInfo', JSON.stringify(vcsProfileInfo));
        });
      }

      const stateObj = JSON.parse(atob(state));
      const queryString = new URLSearchParams({
        provider: stateObj.provider,
        code: params['code'],
        state: stateObj.state,
      }).toString();


      const subdomain = stateObj.state.toLowerCase() === 'nimbuz' ? 'app' : stateObj.state;

      if (stateObj.state.toLowerCase() === 'nimbuz') {
        window.location.href = `${window.location.origin}/create-deployment?${queryString}`;
        return;
      }

      const baseDomain = environment.domain || 'localhost';
      const protocol = window.location.protocol;
      const redirectUrl = `${protocol}//${subdomain}.${baseDomain}/create-deployment?${queryString}`;
      console.log(redirectUrl)
      window.location.href = redirectUrl;
    });
  }
}
