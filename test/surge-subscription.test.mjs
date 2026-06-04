import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const readProjectFile = (path) => readFileSync(join(root, path), 'utf8');

describe('Surge subscription rendering', () => {
    it('declares Surge as a first-class subscription response type', () => {
        const requestTypes = readProjectFile(
            'libs/contract/constants/subscription-template/template-type/request-template-type.constant.ts',
        );
        const templateTypes = readProjectFile(
            'libs/contract/constants/subscription-template/template-type/template-type.constant.ts',
        );
        const responseTypes = readProjectFile(
            'libs/contract/constants/response-rules/response-rules.contants.ts',
        );
        const matcher = readProjectFile(
            'src/modules/subscription-response-rules/services/response-rules-matcher.service.ts',
        );
        const renderer = readProjectFile(
            'src/modules/subscription-template/render-templates.service.ts',
        );
        const configTypes = readProjectFile(
            'src/modules/subscription-template/constants/config-types.ts',
        );

        assert.match(requestTypes, /SURGE:\s*'surge'/);
        assert.match(templateTypes, /SURGE:\s*'SURGE'/);
        assert.match(responseTypes, /RESPONSE_RULES_RESPONSE_TYPES\.SURGE/);
        assert.match(matcher, /REQUEST_TEMPLATE_TYPE\.SURGE/);
        assert.match(matcher, /SUBSCRIPTION_TEMPLATE_TYPE\.SURGE/);
        assert.match(renderer, /case 'SURGE':/);
        assert.match(configTypes, /RESPONSE_RULES_RESPONSE_TYPES\.SURGE/);
        assert.doesNotMatch(renderer, /default:\s*return \{ subscription: '', contentType: '' \}/);
    });

    it('generates Surge proxy sections through the template markers', () => {
        const generator = readProjectFile(
            'src/modules/subscription-template/generators/surge.generator.service.ts',
        );
        const defaultTemplates = readProjectFile(
            'src/modules/subscription-template/constants/default-templates.ts',
        );
        const templateKeys = readProjectFile(
            'libs/contract/constants/templates/template-keys.ts',
        );
        const templateEngine = readProjectFile(
            'src/common/utils/templates/replace-templates-values.ts',
        );

        assert.match(generator, /class SurgeGeneratorService/);
        assert.match(generator, /PROXIES_MARKER/);
        assert.match(generator, /PROXY_NAMES_MARKER/);
        assert.match(generator, /buildTrojanProxy/);
        assert.match(generator, /buildShadowsocksProxy/);
        assert.match(generator, /renderTemplate/);
        assert.match(defaultTemplates, /#!remnawave-proxies/);
        assert.match(defaultTemplates, /#!remnawave-proxy-names/);
        assert.match(templateKeys, /'NODE_MULTIPLIER'/);
        assert.match(templateEngine, /NODE_MULTIPLIER:\s*nodeMultiplier/);
    });
});
