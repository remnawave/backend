import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { NodeSshController } from './node-ssh.controller';
import { NodeSshService } from './node-ssh.service';
import { SshTerminalGateway } from './ssh/ssh-terminal.gateway';
import { VaultOprfService } from './vault-oprf.service';

@Module({
    imports: [CqrsModule],
    controllers: [NodeSshController],
    providers: [NodeSshService, SshTerminalGateway, VaultOprfService],
})
export class NodeSshModule {}
