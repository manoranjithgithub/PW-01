import { defineConfig } from 'cypress';
const environment = process.env.NODE_ENV || 'dev';

const envConfig = await import(`./cypress.env.${environment}.json`).then(m => m.default);

export default defineConfig({
  e2e: {
    ...envConfig,
  },
});
