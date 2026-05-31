// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://garasubo.com',
    output: 'static',
    integrations: [
        tailwind(),
        sitemap({
            customPages: [
                'https://garasubo.com/duel-tools/record/',
                'https://garasubo.com/duel-tools/combo/',
            ],
        }),
    ],
});
