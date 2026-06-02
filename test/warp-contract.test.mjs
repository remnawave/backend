import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const readProjectFile = (path) => readFileSync(join(root, path), 'utf8');

describe('backend WARP node actions', () => {
    it('declares WARP action routes and response schema', () => {
        const routes = readProjectFile('libs/contract/api/routes.ts');
        const nodeRoutes = readProjectFile('libs/contract/api/controllers/nodes.ts');
        const actionsIndex = readProjectFile('libs/contract/commands/nodes/actions/index.ts');
        const schema = readProjectFile('libs/contract/models/node-system.schema.ts');

        assert.match(nodeRoutes, /WARP/);
        assert.match(routes, /WARP/);
        assert.match(nodeRoutes, /warp\/enable/);
        assert.match(nodeRoutes, /warp\/disable/);
        assert.match(routes, /ACTIONS\.WARP\.ENABLE/);
        assert.match(routes, /ACTIONS\.WARP\.DISABLE/);
        assert.match(actionsIndex, /warp-enable/);
        assert.match(actionsIndex, /warp-disable/);
        assert.match(schema, /WarpStatusSchema/);
        assert.match(schema, /warp: z\.optional/);
    });

    it('proxies WARP actions to connected nodes', () => {
        const axiosService = readProjectFile('src/common/axios/axios.service.ts');
        const nodesController = readProjectFile('src/modules/nodes/nodes.controller.ts');
        const nodesService = readProjectFile('src/modules/nodes/nodes.service.ts');
        const dtoIndex = readProjectFile('src/modules/nodes/dtos/index.ts');

        assert.match(axiosService, /enableWarp/);
        assert.match(axiosService, /disableWarp/);
        assert.match(axiosService, /\/node\/warp\/enable/);
        assert.match(axiosService, /\/node\/warp\/disable/);
        assert.match(nodesController, /EnableNodeWarpCommand/);
        assert.match(nodesController, /DisableNodeWarpCommand/);
        assert.match(nodesService, /enableNodeWarp/);
        assert.match(nodesService, /disableNodeWarp/);
        assert.match(nodesService, /node\.isConnected/);
        assert.match(dtoIndex, /enable-node-warp/);
        assert.match(dtoIndex, /disable-node-warp/);
    });
});
