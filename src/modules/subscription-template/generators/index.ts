import { XrayJsonGeneratorService } from './xray-json.generator.service';
import { RawHostsGeneratorService } from './raw-hosts.generator.service';
import { SingBoxGeneratorService } from './singbox.generator.service';
import { MihomoGeneratorService } from './mihomo.generator.service';
import { ClashGeneratorService } from './clash.generator.service';
import { XrayGeneratorService } from './xray.generator.service';
import { FormatHostsService } from './format-hosts.service';

export const TEMPLATE_RENDERERS = [
    FormatHostsService,
    MihomoGeneratorService,
    ClashGeneratorService,
    XrayGeneratorService,
    SingBoxGeneratorService,
    XrayJsonGeneratorService,
    RawHostsGeneratorService,
];
