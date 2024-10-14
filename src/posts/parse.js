"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/no-import-module-exports */
const lodash_1 = __importDefault(require("lodash"));
const nconf_1 = __importDefault(require("nconf"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const url_1 = __importDefault(require("url"));
const winston_1 = __importDefault(require("winston"));
const meta = __importStar(require("../meta"));
const plugins = __importStar(require("../plugins"));
const translator = __importStar(require("../translator"));
const utils = __importStar(require("../utils"));
const postCache = __importStar(require("./cache"));
let sanitizeConfig = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    allowedTags: sanitize_html_1.default.defaults.allowedTags.concat([
        // Some safe-to-use tags to add
        'ins', 'del', 'img', 'button',
        'video', 'audio', 'source', 'iframe', 'embed',
    ]),
    allowedAttributes: Object.assign(Object.assign({}, sanitize_html_1.default.defaults.allowedAttributes), { a: ['href', 'name', 'hreflang', 'media', 'rel', 'target', 'type'], img: ['alt', 'height', 'ismap', 'src', 'usemap', 'width', 'srcset'], iframe: ['height', 'name', 'src', 'width'], video: ['autoplay', 'playsinline', 'controls', 'height', 'loop', 'muted', 'poster', 'preload', 'src', 'width'], audio: ['autoplay', 'controls', 'loop', 'muted', 'preload', 'src'], source: ['type', 'src', 'srcset', 'sizes', 'media', 'height', 'width'], embed: ['height', 'src', 'type', 'width'] }),
    globalAttributes: ['accesskey', 'class', 'contenteditable', 'dir',
        'draggable', 'dropzone', 'hidden', 'id', 'lang', 'spellcheck', 'style',
        'tabindex', 'title', 'translate', 'aria-expanded', 'data-*',
    ],
    allowedClasses: Object.assign({}, sanitize_html_1.default.defaults.allowedClasses),
};
function default_1(Posts) {
    Posts.urlRegex = {
        regex: /href="([^"]+)"/g,
        length: 6,
    };
    Posts.imgRegex = {
        regex: /src="([^"]+)"/g,
        length: 5,
    };
    Posts.parsePost = function (postData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!postData) {
                return postData;
            }
            postData.content = String(postData.content || '');
            const cache = postCache.getOrCreate();
            const pid = String(postData.pid);
            const cachedContent = cache.get(pid);
            if (postData.pid && cachedContent !== undefined) {
                postData.content = cachedContent;
                return postData;
            }
            const data = yield plugins.hooks.fire('filter:parse.post', { postData: postData });
            data.postData.content = translator.escape(data.postData.content);
            if (data.postData.pid) {
                cache.set(pid, data.postData.content);
            }
            return data.postData;
        });
    };
    Posts.parseSignature = function (userData, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            userData.signature = sanitizeSignature(userData.signature || '');
            return yield plugins.hooks.fire('filter:parse.signature', { userData: userData, uid: uid });
        });
    };
    Posts.relativeToAbsolute = function (content, regex) {
        // Turns relative links in content to absolute urls
        if (!content) {
            return content;
        }
        let parsed;
        let current = regex.regex.exec(content);
        let absolute;
        while (current !== null) {
            if (current[1]) {
                try {
                    parsed = url_1.default.parse(current[1]);
                    if (!parsed.protocol) {
                        if (current[1].startsWith('/')) {
                            // Internal link
                            absolute = nconf_1.default.get('base_url') + current[1];
                        }
                        else {
                            // External link
                            const absolute = `//${current[1]}`;
                        }
                        content = content.slice(0, current.index + regex.length) +
                            absolute +
                            content.slice(current.index + regex.length + current[1].length);
                    }
                }
                catch (err) {
                    winston_1.default.verbose(err.message);
                }
            }
            current = regex.regex.exec(content);
        }
        return content;
    };
    Posts.sanitize = function (content) {
        return (0, sanitize_html_1.default)(content, {
            allowedTags: sanitizeConfig.allowedTags,
            allowedAttributes: sanitizeConfig.allowedAttributes,
            allowedClasses: sanitizeConfig.allowedClasses,
        });
    };
    Posts.configureSanitize = () => __awaiter(this, void 0, void 0, function* () {
        // Each allowed tags should have some common global attributes...
        sanitizeConfig.allowedTags.forEach((tag) => {
            sanitizeConfig.allowedAttributes[tag] = lodash_1.default.union(sanitizeConfig.allowedAttributes[tag], sanitizeConfig.globalAttributes);
        });
        // Some plugins might need to adjust or whitelist their own tags...
        sanitizeConfig = yield plugins.hooks.fire('filter:sanitize.config', sanitizeConfig);
    });
    Posts.registerHooks = () => {
        plugins.hooks.register('core', {
            hook: 'filter:parse.post',
            method: (data) => __awaiter(this, void 0, void 0, function* () {
                data.postData.content = Posts.sanitize(data.postData.content);
                return data;
            }),
        });
        plugins.hooks.register('core', {
            hook: 'filter:parse.raw',
            method: (content) => __awaiter(this, void 0, void 0, function* () { return Posts.sanitize(content); }),
        });
        plugins.hooks.register('core', {
            hook: 'filter:parse.aboutme',
            method: (content) => __awaiter(this, void 0, void 0, function* () { return Posts.sanitize(content); }),
        });
        plugins.hooks.register('core', {
            hook: 'filter:parse.signature',
            method: (data) => __awaiter(this, void 0, void 0, function* () {
                data.userData.signature = Posts.sanitize(data.userData.signature);
                return data;
            }),
        });
    };
    function sanitizeSignature(signature) {
        signature = translator.escape(signature);
        const tagsToStrip = [];
        if (meta.config['signatures:disableLinks']) {
            tagsToStrip.push('a');
        }
        if (meta.config['signatures:disableImages']) {
            tagsToStrip.push('img');
        }
        return utils.stripHTMLTags(signature, tagsToStrip);
    }
}
exports.default = default_1;
