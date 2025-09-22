/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.astro',
        './src/**/*.mdx',
        './src/**/*.tsx',
        './src/**/*.ts',
        './src/**/*.js',
        './src/**/*.scss',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Noto Sans JP', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            maxWidth: { prose: '72ch' },
            borderRadius: { xl2: '1rem' },
        },
    },
    darkMode: 'class',
}
