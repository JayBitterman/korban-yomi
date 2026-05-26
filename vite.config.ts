import { defineConfig } from 'vite';

const repositoryName = 'korban-yomi';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}/` : '/',
  test: {
    environment: 'node',
  },
});
