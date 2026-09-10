import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig(({ command }) => ({
  css: { postcss: { plugins: [tailwindcss()] } },
  environments: command === 'build'
    ? {
        client: {
          define: {
            'process.env.__NEXT_ROUTER_BASEPATH': JSON.stringify('/SystemHNWeb'),
          },
        },
      }
    : undefined,
  plugins: [vinext()],
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
}));
