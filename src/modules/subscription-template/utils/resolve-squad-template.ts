import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
    TSubscriptionTemplateType,
} from '@libs/contracts/constants';

import { GetCachedTemplateNameQuery } from '@modules/external-squads/queries/get-template-name';
import type { ISRRContext } from '@modules/subscription-response-rules/interfaces';

import { CheckTemplateExistsQuery } from '../queries/check-template-exists';

const SQUAD_PLACEHOLDER = '{squad}';
const DEFAULT_TEMPLATE_NAME = 'Default';

const logger = new Logger('ResolveSquadTemplate');
const warnedMissingTemplates = new Set<string>();

/**
 * Resolves the template name for a subscription response:
 * - SRR template without {squad} wins as is;
 * - no SRR template -> external squad template (if any);
 * - SRR template with {squad} -> {squad} replaced by the squad template name (or Default),
 *   falling back to the squad template when the resulting template does not exist.
 *
 * Must be called with the final response type, i.e. right before rendering.
 */
export async function resolveSquadTemplate(
    queryBus: QueryBus,
    srrContext: ISRRContext,
    externalSquadUuid: string | null,
): Promise<string | undefined> {
    const srrTemplate = srrContext.overrideTemplateName;

    if (srrTemplate && !srrTemplate.includes(SQUAD_PLACEHOLDER)) {
        return srrTemplate;
    }

    const templateType = srrContext.matchedResponseType as TSubscriptionTemplateType;

    // XRAY_BASE64 is rendered without a template
    if (
        !SUBSCRIPTION_TEMPLATE_TYPE_VALUES.includes(templateType) ||
        templateType === 'XRAY_BASE64'
    ) {
        return srrTemplate;
    }

    let squadTemplate: string | undefined;

    if (externalSquadUuid) {
        const templateName = await queryBus.execute(
            new GetCachedTemplateNameQuery(externalSquadUuid, templateType),
        );

        if (templateName.isOk) {
            squadTemplate = templateName.response;
        }
    }

    if (!srrTemplate) {
        return squadTemplate;
    }

    squadTemplate ??= DEFAULT_TEMPLATE_NAME;

    const candidate = srrTemplate.replaceAll(SQUAD_PLACEHOLDER, squadTemplate);

    const exists = await queryBus.execute(new CheckTemplateExistsQuery(candidate, templateType));

    if (!exists.isOk) {
        logger.warn(
            `Failed to check template "${candidate}" (${templateType}), falling back to "${squadTemplate}"`,
        );

        return squadTemplate;
    }

    if (exists.response) {
        return candidate;
    }

    const warnKey = `${templateType}:${candidate}`;

    // A missing variant is a steady-state config, so warn once per process instead of per request
    if (!warnedMissingTemplates.has(warnKey)) {
        warnedMissingTemplates.add(warnKey);

        logger.warn(
            `Template "${candidate}" (${templateType}) not found, falling back to "${squadTemplate}"`,
        );
    }

    return squadTemplate;
}
