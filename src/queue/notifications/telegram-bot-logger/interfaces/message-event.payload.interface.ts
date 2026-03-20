import { IInlineKeyboard } from './inline-keyboard.interface';

export interface IMessageEventPayload {
    message: string;
    chatId: string;
    threadId: string | undefined;
    keyboard?: IInlineKeyboard[];
}
