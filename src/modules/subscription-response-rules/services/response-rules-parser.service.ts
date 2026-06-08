import { z } from 'zod';
import { Encrypter } from 'age-encryption';

import { Injectable, Logger } from '@nestjs/common';

import { ResponseRulesConfigSchema } from '@libs/contracts/models';

import { TResponseRulesConfig } from '../types/response-rules.types';

@Injectable()
export class ResponseRulesParserService {
    private readonly logger = new Logger(ResponseRulesParserService.name);

    public async parseConfig(configData: unknown): Promise<TResponseRulesConfig> {
        try {
            const config = await ResponseRulesConfigSchema.safeParseAsync(configData);
            if (!config.success) {
                throw new Error(
                    `Invalid config: ${config.error.errors.map((e) => e.message).join(', ')}`,
                );
            }

            await this.validateRules(config.data);

            return config.data;
        } catch (error) {
            if (error instanceof z.ZodError) {
                this.logger.error('Config validation failed:', error.errors);
                throw new Error(`Invalid config: ${error.errors.map((e) => e.message).join(', ')}`);
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

    private async validateRules(config: TResponseRulesConfig): Promise<void> {
        for (const rule of config.rules) {
            for (const condition of rule.conditions) {
                if (condition.operator === 'REGEX' || condition.operator === 'NOT_REGEX') {
                    try {
                        new RegExp(condition.value);
                    } catch {
                        throw new Error(`Invalid regex in rule "${rule.name}": ${condition.value}`);
                    }
                }
            }

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

            if (rule.responseModifications?.agePublicKey) {
                if (rule.responseType !== 'MIHOMO') {
                    throw new Error(
                        `Rule "${rule.name}": agePublicKey is only supported for responseType "MIHOMO"`,
                    );
                }
                try {
                    const enc = new Encrypter();
                    enc.addRecipient(rule.responseModifications.agePublicKey);
                } catch {
                    throw new Error(
                        `Rule "${rule.name}": invalid agePublicKey — cannot create age recipient`,
                    );
                }
            }
        }
    }
}
