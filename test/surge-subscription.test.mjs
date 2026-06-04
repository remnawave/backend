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
        const seed = readProjectFile('prisma/seed/seeders/4_seed-subscription-template.ts');

        assert.match(requestTypes, /SURGE:\s*'surge'/);
        assert.match(templateTypes, /SURGE:\s*'SURGE'/);
        assert.match(responseTypes, /RESPONSE_RULES_RESPONSE_TYPES\.SURGE/);
        assert.match(matcher, /REQUEST_TEMPLATE_TYPE\.SURGE/);
        assert.match(matcher, /SUBSCRIPTION_TEMPLATE_TYPE\.SURGE/);
        assert.match(renderer, /case 'SURGE':/);
        assert.doesNotMatch(renderer, /default:\s*return \{ subscription: '', contentType: '' \}/);
        assert.match(seed, /case SUBSCRIPTION_TEMPLATE_TYPE\.SURGE:/);
    });

    it('generates Surge proxy sections instead of an empty body', () => {
        const generator = readProjectFile(
            'src/modules/subscription-template/generators/surge.generator.service.ts',
        );
        const renderer = readProjectFile(
            'src/modules/subscription-template/render-templates.service.ts',
        );
        const generatorIndex = readProjectFile(
            'src/modules/subscription-template/generators/index.ts',
        );
        const configTypes = readProjectFile(
            'src/modules/subscription-template/constants/config-types.ts',
        );

        assert.match(generator, /class SurgeGeneratorService/);
        assert.match(generator, /\[Proxy\]/);
        assert.match(generator, /\[Proxy Group\]/);
        assert.match(generator, /\[Rule\]/);
        assert.match(generator, /case 'trojan':/);
        assert.match(generator, /this\.buildLine\(name, 'trojan'/);
        assert.match(generator, /\['ws', true\]/);
        assert.match(generator, /NODE_MULTIPLIER/);
        assert.match(generator, /fromNano\(host\.metadata\.consumptionMultiplier/);
        assert.match(renderer, /surgeGeneratorService\.generateConfig/);
        assert.match(generatorIndex, /SurgeGeneratorService/);
        assert.match(configTypes, /RESPONSE_RULES_RESPONSE_TYPES\.SURGE/);
    });
});
