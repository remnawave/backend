import { getBorderCharacters, table } from 'table';
import { readPackageJSON } from 'pkg-types';

export async function getStartMessage(appPort: number, metricsPort: number) {
    const pkg = await readPackageJSON();

    return table(
        [
            [`API Port: ${appPort} | Metrics Port: ${metricsPort}`],
            ['Docs → https://docs.rw\nCommunity → https://t.me/remnawave'],
            ['Rescue CLI → docker exec -it remnawave remnawave'],
        ],
        {
            header: {
                content: `Remnawave Backend v${pkg.version}`,
                alignment: 'center',
            },
            columnDefault: {
                width: 60,
            },
            columns: {
                0: { alignment: 'center' },
                1: { alignment: 'center' },
            },
            drawVerticalLine: () => false,
            border: getBorderCharacters('ramac'),
        },
    );
}
