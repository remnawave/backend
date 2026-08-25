import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';

import { isRestApi, isScheduler } from '@common/utils/startup-app';

import { AdminModule } from './admin/admin.module';
import { ApiTokensModule } from './api-tokens/api-tokens.module';
import { AuthModule } from './auth/auth.module';
import { ConfigProfileModule } from './config-profiles/config-profile.module';
import { ConnectionsModule } from './connections/connections.module';
import { NodeSshModule } from './node-ssh/node-ssh.module';
import { ExternalSquadModule } from './external-squads/external-squads.module';
import { HostsModule } from './hosts/hosts.module';
import { HwidUserDevicesModule } from './hwid-user-devices/hwid-user-devices.module';
import { InfraBillingModule } from './infra-billing/infra-billing.module';
import { InternalSquadModule } from './internal-squads/internal-squad.module';
import { KeygenModule } from './keygen/keygen.module';
import { MetadataModule } from './metadata/metadata.module';
import { NodeIntegrationModule } from './node-integrations';
import { NodePluginModule } from './node-plugins';
import { NodesUsageHistoryModule } from './nodes-usage-history/nodes-usage-history.module';
import { NodesUserUsageHistoryModule } from './nodes-user-usage-history/nodes-user-usage-history.module';
import { NodesModule } from './nodes/nodes.module';
import { RemnawaveServiceModule } from './remnawave-service/remnawave-service.module';
import { RemnawaveSettingsModule } from './remnawave-settings/remnawave-settings.module';
import { SubscriptionPageConfigModule } from './subscription-page-configs/subpage-configs.module';
import { SubscriptionResponseRulesModule } from './subscription-response-rules/subscription-response-rules.module';
import { SubscriptionSettingsModule } from './subscription-settings/subscription-settings.module';
import { SubscriptionTemplateModule } from './subscription-template/subscription-template.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SystemModule } from './system/system.module';
import { UserSubscriptionRequestHistoryModule } from './user-subscription-request-history/user-subscription-request-history.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        RemnawaveSettingsModule,
        ConditionalModule.registerWhen(AdminModule, () => isRestApi()),
        ConditionalModule.registerWhen(AuthModule, () => isRestApi()),
        ConditionalModule.registerWhen(SubscriptionPageConfigModule, () => isRestApi()),
        UsersModule,
        ConditionalModule.registerWhen(SubscriptionResponseRulesModule, () => isRestApi()),
        ConditionalModule.registerWhen(SubscriptionModule, () => isRestApi()),
        ConditionalModule.registerWhen(ApiTokensModule, () => isRestApi()),
        ConfigProfileModule,
        InternalSquadModule,
        ExternalSquadModule,
        KeygenModule,
        NodesModule,
        NodePluginModule,
        NodeIntegrationModule,
        HostsModule,
        NodesUserUsageHistoryModule,
        HwidUserDevicesModule,
        NodesUsageHistoryModule,
        InfraBillingModule,
        UserSubscriptionRequestHistoryModule,
        ConditionalModule.registerWhen(SystemModule, () => isRestApi()),
        ConditionalModule.registerWhen(SubscriptionTemplateModule, () => isRestApi()),
        ConditionalModule.registerWhen(SubscriptionSettingsModule, () => isRestApi()),
        ConditionalModule.registerWhen(RemnawaveServiceModule, () => isScheduler()),
        ConditionalModule.registerWhen(ConnectionsModule, () => isRestApi()),
        ConditionalModule.registerWhen(NodeSshModule, () => isRestApi()),
        ConditionalModule.registerWhen(MetadataModule, () => isRestApi()),
    ],
})
export class RemnawaveModules {}
