import { z } from 'zod';

import { Injectable, Logger } from '@nestjs/common';

import { ResponseRulesConfigSchema } from '@libs/contracts/models';

import { TResponseRuleConditionNode, TResponseRulesConfig } from '../types/response-rules.types';

const MAX_CONDITION_GROUP_DEPTH = 3;

@Injectable()
export class ResponseRulesParserService {
    private readonly logger = new Logger(ResponseRulesParserService.name);

    public async parseConfig(configData: unknown): Promise<TResponseRulesConfig> {
        try {
            const config = await ResponseRulesConfigSchema.safeParseAsync(configData);
            if (!config.success) {
                throw new Error(
                    `Invalid config: ${config.error.issues.map((issue) => issue.message).join(', ')}`,
                );
            }

            this.validateRules(config.data);

            return config.data;
        } catch (error) {
            if (error instanceof z.ZodError) {
                this.logger.error('Config validation failed:', error.issues);
                throw new Error(
                    `Invalid config: ${error.issues.map((issue) => issue.message).join(', ')}`,
                );
            }
            throw error;
        }
    }

    public async parseJsonConfig(jsonString: string): Promise<TResponseRulesConfig> {
        try {
            const data = JSON.parse(jsonString);
            return await this.parseConfig(data);
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('Invalid JSON format');
            }
            throw error;
        }
    }

    private validateRules(config: TResponseRulesConfig): void {
        for (const rule of config.rules) {
            this.validateConditions(rule.name, rule.conditions, 0);

            if (
                rule.responseModifications &&
                rule.responseModifications.additionalExtendedClientsRegex
            ) {
                for (const regex of rule.responseModifications.additionalExtendedClientsRegex) {
                    try {
                        new RegExp(regex);
                    } catch {
                        throw new Error(`Invalid regex in rule "${rule.name}": ${regex}`);
                    }
                }
            }
        }
    }

    private validateConditions(
        ruleName: string,
        nodes: TResponseRuleConditionNode[],
        depth: number,
    ): void {
        for (const node of nodes) {
            if ('conditions' in node) {
                if (depth >= MAX_CONDITION_GROUP_DEPTH) {
                    throw new Error(
                        `Condition groups in rule "${ruleName}" are nested deeper than ${MAX_CONDITION_GROUP_DEPTH} levels`,
                    );
                }

                this.validateConditions(ruleName, node.conditions, depth + 1);
                continue;
            }

            if (node.operator === 'REGEX' || node.operator === 'NOT_REGEX') {
                const patterns = Array.isArray(node.value) ? node.value : [node.value];

                for (const pattern of patterns) {
                    try {
                        new RegExp(pattern);
                    } catch {
                        throw new Error(`Invalid regex in rule "${ruleName}": ${pattern}`);
                    }
                }
            }

            if ('versionPattern' in node && node.versionPattern) {
                let groups: number;

                try {
                    groups = new RegExp(`${node.versionPattern}|`).exec('')!.length - 1;
                } catch {
                    throw new Error(
                        `Invalid version pattern in rule "${ruleName}": ${node.versionPattern}`,
                    );
                }

                if (groups < 1) {
                    throw new Error(
                        `Version pattern in rule "${ruleName}" has no capture group: ${node.versionPattern}`,
                    );
                }
            }
        }
    }
}
