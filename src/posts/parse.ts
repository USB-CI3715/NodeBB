/* eslint-disable import/no-import-module-exports */
import _ from 'lodash';
import nconf from 'nconf';
import sanitize from 'sanitize-html';
import url from 'url';
import winston from 'winston';

import * as meta from '../meta';
import * as plugins from '../plugins';
import * as translator from '../translator';
import * as utils from '../utils';
import * as postCache from './cache';

interface SanitizeConfig{
	allowedTags: string[];
	allowedAttributes: { [key: string]: string[] };
	globalAttributes: string[];
	allowedClasses: { [key: string]: string[] };
}
let sanitizeConfig: SanitizeConfig = {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	/* eslint-disable @typescript-eslint/no-unsafe-assignment */

	allowedTags: sanitize.defaults.allowedTags.concat([
		// Some safe-to-use tags to add
		'ins', 'del', 'img', 'button',
		'video', 'audio', 'source', 'iframe', 'embed',
	]),
	allowedAttributes: {
		...sanitize.defaults.allowedAttributes,
		a: ['href', 'name', 'hreflang', 'media', 'rel', 'target', 'type'],
		img: ['alt', 'height', 'ismap', 'src', 'usemap', 'width', 'srcset'],
		iframe: ['height', 'name', 'src', 'width'],
		video: ['autoplay', 'playsinline', 'controls', 'height', 'loop', 'muted', 'poster', 'preload', 'src', 'width'],
		audio: ['autoplay', 'controls', 'loop', 'muted', 'preload', 'src'],
		source: ['type', 'src', 'srcset', 'sizes', 'media', 'height', 'width'],
		embed: ['height', 'src', 'type', 'width'],
	},
	globalAttributes: ['accesskey', 'class', 'contenteditable', 'dir',
		'draggable', 'dropzone', 'hidden', 'id', 'lang', 'spellcheck', 'style',
		'tabindex', 'title', 'translate', 'aria-expanded', 'data-*',
	],
	allowedClasses: {
		...sanitize.defaults.allowedClasses,
	},
};


interface PostsType {
	urlRegex: { regex: RegExp, length: number };
	imgRegex: { regex: RegExp, length: number };
	parsePost: (postData: any) => Promise<any>;
	parseSignature: (userData: any, uid: string) => Promise<any>;
	relativeToAbsolute: (content: string, regex: { regex: RegExp, length: number }) => string;
	sanitize: (content: string) => string;
	configureSanitize: () => Promise<void>;
	registerHooks: () => void;
}

export default function (Posts: PostsType) {
	Posts.urlRegex = {
		regex: /href="([^"]+)"/g,
		length: 6,
	};

	Posts.imgRegex = {
		regex: /src="([^"]+)"/g,
		length: 5,
	};

	Posts.parsePost = async function (postData: { content: string; pid?: string }) {
		if (!postData) {
			return postData as { content: string; pid?: string };
		}
		postData.content = String(postData.content || '');
		const cache = postCache.getOrCreate();
		const pid = String(postData.pid);
		const cachedContent = cache.get(pid);
		if (postData.pid && cachedContent !== undefined) {
			postData.content = cachedContent;
			return postData;
		}

		const data = await plugins.hooks.fire('filter:parse.post', { postData: postData });
		data.postData.content = translator.escape(data.postData.content);
		if (data.postData.pid) {
			cache.set(pid, data.postData.content);
		}
		return data.postData;
	};

	Posts.parseSignature = async function (userData: any, uid: string) {
		userData.signature = sanitizeSignature(userData.signature || '');
		return await plugins.hooks.fire('filter:parse.signature', { userData: userData, uid: uid });
	};

	Posts.relativeToAbsolute = function (content: string, regex: { regex: RegExp, length: number }) {
		// Turns relative links in content to absolute urls
		if (!content) {
			return content;
		}
		let parsed: url.UrlWithStringQuery | undefined;
		let current = regex.regex.exec(content);
		let absolute: string | undefined;
		while (current !== null) {
			if (current[1]) {
				try {
					parsed = url.parse(current[1]);
					if (!parsed.protocol) {
						if (current[1].startsWith('/')) {
							// Internal link
							absolute = nconf.get('base_url') + current[1];
						} else {
							// External link
							const absolute: string = `//${current[1]}`;
						}

						content = content.slice(0, current.index + regex.length) +
						absolute +
						content.slice(current.index + regex.length + current[1].length);
					}
				} catch (err) {
					winston.verbose(err.message);
				}
			}
			current = regex.regex.exec(content);
		}

		return content;
	};

	Posts.sanitize = function (content: string) {
		return sanitize(content, {
			allowedTags: sanitizeConfig.allowedTags,
			allowedAttributes: sanitizeConfig.allowedAttributes,
			allowedClasses: sanitizeConfig.allowedClasses,
		});
	};

	Posts.configureSanitize = async () => {
		// Each allowed tags should have some common global attributes...
		sanitizeConfig.allowedTags.forEach((tag) => {
			sanitizeConfig.allowedAttributes[tag] = _.union(
				sanitizeConfig.allowedAttributes[tag],
				sanitizeConfig.globalAttributes
			);
		});

		// Some plugins might need to adjust or whitelist their own tags...
		sanitizeConfig = await plugins.hooks.fire('filter:sanitize.config', sanitizeConfig);
	};

	Posts.registerHooks = () => {
		plugins.hooks.register('core', {
			hook: 'filter:parse.post',
			method: async (data: any) => {
				data.postData.content = Posts.sanitize(data.postData.content);
				return data;
			},
		});

		plugins.hooks.register('core', {
			hook: 'filter:parse.raw',
			method: async (content: string) => Posts.sanitize(content),
		});

		plugins.hooks.register('core', {
			hook: 'filter:parse.aboutme',
			method: async (content: string) => Posts.sanitize(content),
		});

		plugins.hooks.register('core', {
			hook: 'filter:parse.signature',
			method: async (data: any) => {
				data.userData.signature = Posts.sanitize(data.userData.signature);
				return data;
			},
		});
	};

	function sanitizeSignature(signature: string) {
		signature = translator.escape(signature);
		const tagsToStrip: string[] = [];

		if (meta.config['signatures:disableLinks']) {
			tagsToStrip.push('a');
		}

		if (meta.config['signatures:disableImages']) {
			tagsToStrip.push('img');
		}

		return utils.stripHTMLTags(signature, tagsToStrip);
	}
}
