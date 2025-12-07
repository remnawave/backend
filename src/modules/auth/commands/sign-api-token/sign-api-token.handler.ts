import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { ok, TResult } from '@common/types';
import { ROLE } from '@libs/contracts/constants';

import { SignApiTokenCommand } from './sign-api-token.command';
import { IJWTAuthPayload } from '../../interfaces';

@CommandHandler(SignApiTokenCommand)
export class SignApiTokenHandler implements ICommandHandler<SignApiTokenCommand, TResult<string>> {
    constructor(private readonly jwtService: JwtService) {}

    async execute(command: SignApiTokenCommand): Promise<TResult<string>> {
        const payload: IJWTAuthPayload = {
            uuid: command.uuid,
            username: null,
            role: ROLE.API,
        };

        return ok(
            this.jwtService.sign(payload, {
                expiresIn: '99999d',
            }),
        );
    }
}
