import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            draft: z.boolean().optional(),
            tags: z.array(z.string()).default([]),
            heroImage: image().optional(),
        }),
});

export const collections = {
    blog,
};
