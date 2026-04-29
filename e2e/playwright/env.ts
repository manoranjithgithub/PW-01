/// <reference types="node" />

import { environment as dev } from '../../src/environments/environment';
import { environment as prod } from '../../src/environments/environment.prod';

export type TestEnv = 'dev' | 'prod';

export const TEST_ENV: TestEnv = (process.env.TEST_ENV === 'prod' ? 'prod' : 'dev');

export const envConfig = TEST_ENV === 'prod' ? prod : dev;
