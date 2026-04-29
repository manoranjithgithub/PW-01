# nimbuz-portal-fe

## latest version
1.0.5

## change log
### 1.0.5
implementation: playwright e2e implementation


### 1.0.4
implementation: cpu throttle graph
bugfix: https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3057

### 1.0.3
incident:
https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3062

implementation:
 delete functionality in user module and validations

bug fixes:
https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3055 -- port issue 
https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3054 -- replica error message
https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3058 -- code as config validation
https://gitlab.dilligentech.com/dt/paas/nimbuz-ops-hub/-/issues/3056 -- application name validation 

### 1.0.2
- loader fix for review page 
Bug Fix: redeploy after cancel setting page should be editable

### 1.0.1
Bug Fix:
INC-3000  : blocking the action with a message 'Tool is deploying, please wait' similar to the deployments
Issue -2978 : Enable authentication not retaining its state
Issue - 3010 : Incorrect message for redepoly
Issue - 2999 : Project- description field validation
Issue -3009 : Incorrect message on resume after cancel pop-up
Issue- 3007 : Port field validation

### 1.0.1
- RabbitMQ Integration
- Tool Field Validation
- Applied UI feedback changes for tools
- Status Handling Enhancements
- Bug Fixes & Refactoring



## Getting started

#### <i>Prerequisites</i>
Before you begin, make sure your development environment includes `Node.js®` and an `npm` package manager.

###### Node.js
[**Angular 17**](https://angular.io/guide/what-is-angular) requires `Node.js` LTS version `^18.13` or `^20.09`.

- To check your version, run `node -v` in a terminal/console window.
- To get `Node.js`, go to [nodejs.org](https://nodejs.org/).

###### Angular CLI
Install the Angular CLI globally using a terminal/console window.
```bash
npm install -g @angular/cli
```

### Installation

``` bash
$ npm install
$ npm update
```

### Basic usage

``` bash
# dev server with hot reload at http://localhost:4200
$ npm start (or)
$ ng serve 
```

Navigate to [http://localhost:4200](http://localhost:4200). The app will automatically reload if you change any of the source files.

#### Build

Run `build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
# build for production with minification
$ npm run build
```
## What's included

Within the download you'll find the following directories and files, logically grouping common assets and providing both compiled and minified variations. 
Its is not accurate but You'll see something like this:
```

PORTAL-FE
├── src/                         # project root
│   ├── app/                     # main app directory
|   │   ├── icons/               # icons set for the app
|   │   ├── layout/              # layout 
|   |   │   └── default-layout/  # layout components
|   |   |       └── _nav.js      # sidebar navigation config
|   │   └── views/               # application views
│   ├── assets/                  # images, icons, etc.
│   ├── components/              # components for demo only
│   ├── scss/                    # scss styles
│   └── index.html               # html template
│
├── angular.json
├── README.md
└── package.json
```

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
