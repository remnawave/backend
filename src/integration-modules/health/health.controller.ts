import { PrismaClient } from '@generated/prisma/client';

import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Controller, Get } from '@nestjs/common';

import { HEALTH_ROOT } from '@libs/contracts/api';

@Controller(HEALTH_ROOT)
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma<PrismaClient>>,
    ) {}

    @HealthCheck()
    @Get()
    readiness() {
        return this.health.check([
            async () => this.prismaHealth.pingCheck('database', this.prisma.tx),
        ]);
    }
}
