import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MeshController } from './mesh.controller';
import { MeshService } from './mesh.service';

@Module({
    // JwtDefaultGuard needs QueryBus (same as the other modules that use the guard)
    imports: [CqrsModule],
    controllers: [MeshController],
    providers: [MeshService],
    exports: [MeshService],
})
export class MeshModule {}
