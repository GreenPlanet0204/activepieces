import { BasicAuthPropertyValue, createAction, Property } from "@activepieces/pieces-framework";
import { wordpressCommon, WordpressMedia } from "../common";
import { httpClient, HttpMethod, HttpRequest, AuthenticationType } from "@activepieces/pieces-common";


export const createWordpressPost = createAction({
    name: 'create_post',
    description: 'Create new post on Wordpress',
    displayName: 'Create Post',
    props: {
        connection: wordpressCommon.connection,
        website_url: wordpressCommon.website_url,
        title: Property.ShortText({
            description: 'Title of the post about to be added',
            displayName: 'Title',
            required: true,
        }),
        content: Property.LongText({
            description: 'Uses the WordPress Text Editor which supports HTML',
            displayName: 'Content',
            required: true
        }),
        slug: Property.ShortText({
            displayName: 'Slug',
            required: false,
        }),
        date: Property.ShortText({
            description: 'Post publish date (ISO-8601)',
            displayName: 'Date',
            required: false,
        }),
        tags: Property.MultiSelectDropdown<string, false>({
            description: 'Post tags',
            displayName: 'Tags',
            required: false,
            refreshers: ["connection", "website_url"],
            options: async (propsValues) => {
                const connection = propsValues['connection'] as BasicAuthPropertyValue;
                if (!connection) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first'
                    }
                }
                if (!propsValues['website_url']) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please input the correct url'
                    }
                }
                if (!(await wordpressCommon.urlExists((propsValues['website_url'] as string).trim()))) {
                    return {
                        disabled: true,
                        placeholder: 'Incorrect website url',
                        options: [],
                    };
                }

                let pageCursor = 1;
                const getTagsParams = {
                    websiteUrl: (propsValues['website_url'] as string).trim(),
                    username: connection.username,
                    password: connection.password,
                    page: pageCursor
                };
                const result: { id: string, name: string }[] = [];
                let tags = await wordpressCommon.getTags(getTagsParams);
                if (tags.totalPages === 0) {
                    result.push(...tags.tags);
                }
                while (tags.tags.length > 0 && pageCursor <= tags.totalPages) {
                    result.push(...tags.tags);
                    pageCursor++;
                    tags = await wordpressCommon.getTags(getTagsParams);
                }
                if (result.length === 0) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please add tags from your admin dashboard"
                    }
                }
                const options = result.map(res => {
                    return {
                        label: res.name,
                        value: res.id
                    }
                });
                return {
                    options: options,
                    disabled: false,
                }
            }
        }),
        categories: Property.MultiSelectDropdown<string, false>({
            description: 'Post categories',
            displayName: 'Categories',
            required: false,
            refreshers: ["connection", "website_url"],
            options: async (propsValues) => {
                const connection = propsValues['connection'] as BasicAuthPropertyValue;
                if (!connection) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first'
                    }
                }
                if (!propsValues['website_url']) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please input the correct url'
                    }
                }
                if (!(await wordpressCommon.urlExists((propsValues['website_url'] as string).trim()))) {
                    return {
                        disabled: true,
                        placeholder: 'Incorrect website url',
                        options: [],
                    };
                }

                let pageCursor = 1;
                const getTagsParams = {
                    websiteUrl: propsValues['website_url'] as string,
                    username: connection.username,
                    password: connection.password,
                    page: pageCursor
                };
                const result: { id: string, name: string }[] = [];
                let categories = await wordpressCommon.getCategories(getTagsParams);
                if (categories.totalPages === 0) {
                    result.push(...categories.categories);
                }
                while (categories.categories.length > 0 && pageCursor <= categories.totalPages) {
                    result.push(...categories.categories);
                    pageCursor++;
                    categories = await wordpressCommon.getCategories(getTagsParams);
                }
                if (result.length === 0) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please add categoreis from your admin dashboard"
                    }
                }
                const options = result.map(res => {
                    return {
                        label: res.name,
                        value: res.id
                    }
                });
                return {
                    options: options,
                    disabled: false,
                }
            }
        }),
        featured_media: Property.Dropdown({
            description: 'Choose from one of your uploaded media files',
            displayName: 'Featured Media (image)',
            required: false,
            refreshers: ['connection', 'website_url'],
            options: async (propsValues) => {

                const connection = propsValues['connection'] as BasicAuthPropertyValue;
                if (!connection) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first'
                    }
                }
                if (!propsValues['website_url']) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please input the correct url'
                    }
                }
                if (!(await wordpressCommon.urlExists(propsValues['website_url'].toString().trim()))) {
                    return {
                        disabled: true,
                        placeholder: 'Incorrect website url',
                        options: [],
                    };
                }

                let pageCursor = 1;
                const getMediaParams = {
                    websiteUrl: propsValues['website_url'] as string,
                    username: connection.username,
                    password: connection.password,
                    page: pageCursor
                };
                const result: WordpressMedia[] = [];
                let media = await wordpressCommon.getMedia(getMediaParams);
                if (media.totalPages === 0) {
                    result.push(...media.media);
                }
                while (media.media.length > 0 && pageCursor <= media.totalPages) {
                    result.push(...media.media);
                    pageCursor++;
                    media = await wordpressCommon.getMedia(getMediaParams);
                }
                if (result.length === 0) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please add an image to your media from your admin dashboard"
                    }
                }
                const options = result.map(res => {
                    return {
                        label: res.title.rendered,
                        value: res.id
                    }
                });
                return {
                    options: options,
                    disabled: false,
                }
            }
        }),
        status: Property.StaticDropdown({
            description: 'Choose post status',
            displayName: 'Status',
            required: false,
            options: {
                disabled: false, options: [
                    { value: 'publish', label: 'Published' },
                    { value: 'future', label: 'Scheduled' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'private', label: 'Private' },
                    { value: 'trash', label: 'Trash' }]
            }
        }),
        excerpt: Property.LongText({
            description: 'Uses the WordPress Text Editor which supports HTML',
            displayName: 'Excerpt',
            required: false
        }),
        comment_status: Property.Checkbox({
            displayName: 'Enable Comments',
            required: false
        }),
        ping_status: Property.Checkbox({
            displayName: 'Open to Pinging',
            required: false
        }),
    },
    async run(context) {
        if (!(await wordpressCommon.urlExists(context.propsValue.website_url.trim()))) {
            throw new Error('Website url is invalid: ' + context.propsValue.website_url);
        }
        const requestBody: Record<string, unknown> = {};
        if (context.propsValue.date) {
            requestBody['date'] = context.propsValue.date;
        }
        if (context.propsValue.comment_status !== undefined) {
            requestBody['comment_status'] = context.propsValue.comment_status ? 'open' : 'closed';
        }
        if (context.propsValue.categories) {
            requestBody['categories'] = context.propsValue.categories;
        }
        if (context.propsValue.slug) {
            requestBody['slug'] = context.propsValue.slug;
        }
        if (context.propsValue.excerpt) {
            requestBody['excerpt'] = context.propsValue.excerpt;
        }
        if (context.propsValue.tags) {
            requestBody['tags'] = context.propsValue.tags;
        }
        if (context.propsValue.ping_status !== undefined) {
            requestBody['ping_status'] = context.propsValue.ping_status ? 'open' : 'closed';
        }
        if (context.propsValue.status !== undefined) {
            requestBody['status'] = context.propsValue.status;
        }
        if (context.propsValue.featured_media !== undefined) {
            requestBody['featured_media'] = context.propsValue.featured_media;
        }
        requestBody['content'] = context.propsValue.content;
        requestBody['title'] = context.propsValue.title;
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${context.propsValue.website_url.trim()}/wp-json/wp/v2/posts`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: context.propsValue.connection.username,
                password: context.propsValue.connection.password,
            },
            body: requestBody
        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return response;
    }
});
