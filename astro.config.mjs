// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://garasubo.com',
    output: 'static',
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [
        sitemap({
            customPages: [
                'https://garasubo.com/duel-tools/record/',
                'https://garasubo.com/duel-tools/combo/',
            ],
        }),
    ],
});
