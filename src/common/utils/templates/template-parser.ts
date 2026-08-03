import { TemplateKeys } from '@libs/contracts/constants/templates/template-keys';

import { isTemplateKey, TemplateResolvers } from './template-variables';

type TemplateTransform = (input: string) => string;

type TemplateNode =
    | { kind: 'text'; value: string }
    | { kind: 'variable'; key: TemplateKeys; args: Readonly<Record<string, string>> };

export interface ParsedTemplate {
    readonly nodes: readonly TemplateNode[];
    readonly transform: TemplateTransform | null;
}

const BASE64_RESULT_PREFIX = 'base64:';
const BASE64_ENCODE_PREFIX = 'rwEncodeBase64:';

const TEMPLATE_REGEX = /\{\{(\w+)(?::([^{}]*))?\}\}/g;

const PARSE_CACHE_LIMIT = 10_000;
const parseCache = new Map<string, ParsedTemplate>();

const TRANSFORMATIONS: ReadonlyArray<{ prefix: string; transform: TemplateTransform }> = [
    {
        prefix: BASE64_ENCODE_PREFIX,
        transform: (input) => BASE64_RESULT_PREFIX + Buffer.from(input, 'utf8').toString('base64'),
    },
];

function parseTransform(template: string): { body: string; transform: TemplateTransform | null } {
    for (const { prefix, transform } of TRANSFORMATIONS) {
        if (template.startsWith(prefix)) {
            return { body: template.slice(prefix.length), transform };
        }
    }

    return { body: template, transform: null };
}

function parseArgs(rawArgs: string): Record<string, string> {
    const args: Record<string, string> = {};

    for (const pair of rawArgs.split('|')) {
        const separatorIndex = pair.indexOf('=');

        if (separatorIndex !== -1) {
            args[pair.slice(0, separatorIndex).trim()] = pair.slice(separatorIndex + 1);
        }
    }

    return args;
}

export function parseTemplate(template: string): ParsedTemplate {
    const cached = parseCache.get(template);
    if (cached !== undefined) {
        return cached;
    }

    const { body, transform } = parseTransform(template);

    const nodes: TemplateNode[] = [];

    let cursor = 0;
    let match: RegExpExecArray | null;

    TEMPLATE_REGEX.lastIndex = 0;

    while ((match = TEMPLATE_REGEX.exec(body)) !== null) {
        const [placeholder, key, rawArgs] = match;

        if (match.index > cursor) {
            nodes.push({ kind: 'text', value: body.slice(cursor, match.index) });
        }
        cursor = match.index + placeholder.length;

        nodes.push(
            isTemplateKey(key)
                ? { kind: 'variable', key, args: rawArgs === undefined ? {} : parseArgs(rawArgs) }
                : { kind: 'text', value: placeholder },
        );
    }

    if (cursor < body.length) {
        nodes.push({ kind: 'text', value: body.slice(cursor) });
    }

    const parsed: ParsedTemplate = { nodes, transform };

    if (parseCache.size >= PARSE_CACHE_LIMIT) {
        parseCache.delete(parseCache.keys().next().value!);
    }
    parseCache.set(template, parsed);

    return parsed;
}

export function renderTemplate(parsed: ParsedTemplate, resolvers: TemplateResolvers): string {
    let result = '';

    for (const node of parsed.nodes) {
        result += node.kind === 'text' ? node.value : resolvers[node.key](node.args).toString();
    }

    return parsed.transform ? parsed.transform(result) : result;
}
