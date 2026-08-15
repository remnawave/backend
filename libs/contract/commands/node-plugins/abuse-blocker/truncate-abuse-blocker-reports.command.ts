import { NODE_PLUGINS_ROUTES, REST_API } from '../../../api';
import { getEndpointDetails } from '../../../constants';

export namespace TruncateAbuseBlockerReportsCommand {
    export const url = REST_API.NODE_PLUGINS.ABUSE_BLOCKER.TRUNCATE_REPORTS;
    export const endpointDetails = getEndpointDetails(
        NODE_PLUGINS_ROUTES.ABUSE_BLOCKER.TRUNCATE_REPORTS,
        'delete',
        'Truncate Abuse Blocker Reports',
        { scope: 'abuse-blocker-reports', kind: 'write' },
    );
}
