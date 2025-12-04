import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { GetAllHwidDevicesCommand } from '@libs/contracts/commands';
import { ERRORS, EVENTS } from '@libs/contracts/constants';
import { THwidSettings } from '@libs/contracts/models';

import { UserHwidDeviceEvent } from '@integration-modules/notifications/interfaces';

import { GetCachedSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-cached-subscrtipion-settings';
import { GetCachedExternalSquadSettingsQuery } from '@modules/external-squads/queries/get-cached-external-squad-settings';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { HwidUserDevicesRepository } from './repositories/hwid-user-devices.repository';
import { HwidUserDeviceEntity } from './entities/hwid-user-device.entity';
import { GetHwidDevicesStatsResponseModel } from './models';
import { CreateUserHwidDeviceRequestDto } from './dtos';

@Injectable()
export class HwidUserDevicesService {
    private readonly logger = new Logger(HwidUserDevicesService.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly hwidUserDevicesRepository: HwidUserDevicesRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async createUserHwidDevice(
        dto: CreateUserHwidDeviceRequestDto,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: dto.userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const isDeviceExists = await this.hwidUserDevicesRepository.checkHwidExists(
                dto.hwid,
                dto.userUuid,
            );

            if (isDeviceExists) {
                return fail(ERRORS.USER_HWID_DEVICE_ALREADY_EXISTS);
            }

            let hwidSettings: THwidSettings | undefined;

            const subscrtipionSettings = await this.queryBus.execute(
                new GetCachedSubscriptionSettingsQuery(),
            );

            if (!subscrtipionSettings) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            if (subscrtipionSettings.hwidSettings.enabled) {
                hwidSettings = subscrtipionSettings.hwidSettings;
            }

            if (user.response.externalSquadUuid) {
                const externalSquadSettings = await this.queryBus.execute(
                    new GetCachedExternalSquadSettingsQuery(user.response.externalSquadUuid),
                );

                if (externalSquadSettings && externalSquadSettings.hwidSettings) {
                    hwidSettings = externalSquadSettings.hwidSettings;
                }
            }

            if (hwidSettings && hwidSettings.enabled) {
                const count = await this.hwidUserDevicesRepository.countByUserUuid(dto.userUuid);

                const deviceLimit =
                    user.response.hwidDeviceLimit ?? hwidSettings.fallbackDeviceLimit;

                if (count >= deviceLimit) {
                    return fail(ERRORS.USER_HWID_DEVICE_LIMIT_REACHED);
                }
            }

            const result = await this.hwidUserDevicesRepository.create(
                new HwidUserDeviceEntity(dto),
            );

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.ADDED,
                new UserHwidDeviceEvent(user.response, result, EVENTS.USER_HWID_DEVICES.ADDED),
            );

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid: dto.userUuid,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_HWID_USER_DEVICE_ERROR);
        }
    }

    public async getUserHwidDevices(userUuid: string): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_HWID_DEVICES_ERROR);
        }
    }

    public async deleteUserHwidDevice(
        hwid: string,
        userUuid: string,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const hwidDevice = await this.hwidUserDevicesRepository.findFirstByCriteria({
                hwid,
                userUuid,
            });

            if (!hwidDevice) {
                return fail(ERRORS.HWID_DEVICE_NOT_FOUND);
            }

            await this.hwidUserDevicesRepository.deleteByHwidAndUserUuid(hwid, userUuid);

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.DELETED,
                new UserHwidDeviceEvent(
                    user.response,
                    hwidDevice,
                    EVENTS.USER_HWID_DEVICES.DELETED,
                ),
            );

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_HWID_USER_DEVICE_ERROR);
        }
    }

    public async deleteAllUserHwidDevices(
        userUuid: string,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            await this.hwidUserDevicesRepository.deleteByUserUuid(userUuid);

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_HWID_USER_DEVICES_ERROR);
        }
    }

    public async getAllHwidDevices(dto: GetAllHwidDevicesCommand.RequestQuery): Promise<
        TResult<{
            total: number;
            devices: HwidUserDeviceEntity[];
        }>
    > {
        try {
            const [devices, total] = await this.hwidUserDevicesRepository.getAllHwidDevices(dto);

            return ok({ devices, total });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_HWID_DEVICES_ERROR);
        }
    }

    public async getHwidDevicesStats(): Promise<TResult<GetHwidDevicesStatsResponseModel>> {
        try {
            const stats = await this.hwidUserDevicesRepository.getHwidDevicesStats();

            return ok(
                new GetHwidDevicesStatsResponseModel({
                    byPlatform: stats.byPlatform,
                    byApp: stats.byApp,
                    stats: stats.stats,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_HWID_DEVICES_STATS_ERROR);
        }
    }
}
