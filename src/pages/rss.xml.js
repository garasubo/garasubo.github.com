import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const posts = (await getCollection('blog'))
        .filter((post) => post.data.draft !== true)
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

    return rss({
        title: '@garasubo Blog',
        description: '@garasuboのブログ。Rust / IoT / Systems / Web まわりの記事をまとめています。',
        site: context.site,
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.pubDate,
            link: `/blog/${post.slug}/`,
        })),
        customData: '<language>ja</language>',
    });
}
