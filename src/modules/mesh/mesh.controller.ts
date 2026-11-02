import { ROLE } from '@contract/constants';

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles/roles';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles/roles.guard';

import {
    MeshEtcdDto,
    MeshFlagsDto,
    MeshJobDto,
    MeshNameDto,
    MeshNodeDto,
    MeshPinDto,
    MeshRelayDto,
} from './mesh.dto';
import { MeshService } from './mesh.service';

@ApiBearerAuth('Authorization')
@ApiTags('Mesh')
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@Controller('mesh')
export class MeshController {
    constructor(private readonly meshService: MeshService) {}

    @Get('status')
    async getStatus() {
        return { response: await this.meshService.request('/status') };
    }

    @Post('flags')
    async setFlags(@Body() body: MeshFlagsDto) {
        return { response: await this.meshService.request('/api/flags', body) };
    }

    @Post('pin')
    async pin(@Body() body: MeshPinDto) {
        return { response: await this.meshService.request('/api/pin', body) };
    }

    @Post('nodes')
    async addNode(@Body() body: MeshNodeDto) {
        return { response: await this.meshService.request('/api/nodes', body) };
    }

    @Post('nodes/remove')
    async removeNode(@Body() body: MeshNameDto) {
        return { response: await this.meshService.request('/api/nodes/remove', body) };
    }

    @Get('jobs/:id')
    async getJob(@Param() params: MeshJobDto) {
        return { response: await this.meshService.request(`/api/jobs/${params.id}`) };
    }

    @Post('relay')
    async setRelay(@Body() body: MeshRelayDto) {
        return { response: await this.meshService.request('/api/relay', body) };
    }

    @Post('etcd')
    async setEtcd(@Body() body: MeshEtcdDto) {
        return { response: await this.meshService.request('/api/etcd', body) };
    }

    @Post('probe')
    async probe() {
        return { response: await this.meshService.request('/api/probe', {}) };
    }
}
