import { Counter, register } from 'prom-client';

// Direct prom-client counters (skipping @willsoto/nestjs-prometheus's
// `makeCounterProvider` because that path force-prefixes everything with
// `remnawave_`, and we want stable names that compono-relay-sync's grafana
// dashboards can grep for).
//
// Singletons guarded against double-registration so `compono-relay-sync`
// hot-reload / hot-import paths don't blow up.

function getOrRegister<T extends Counter<string>>(name: string, factory: () => T): T {
    const existing = register.getSingleMetric(name);
    if (existing) return existing as T;
    return factory();
}

export const reconcileAddedTotal = getOrRegister(
    'compono_reconcile_added_total',
    () =>
        new Counter({
            name: 'compono_reconcile_added_total',
            help: 'Total users added to a node by reconcile, by node and inbound tag',
            labelNames: ['node_uuid', 'tag'],
        }),
);

export const reconcileRemovedTotal = getOrRegister(
    'compono_reconcile_removed_total',
    () =>
        new Counter({
            name: 'compono_reconcile_removed_total',
            help: 'Total users removed from a node by reconcile, by node and inbound tag',
            labelNames: ['node_uuid', 'tag'],
        }),
);

export const reconcileErrorsTotal = getOrRegister(
    'compono_reconcile_errors_total',
    () =>
        new Counter({
            name: 'compono_reconcile_errors_total',
            help: 'Total reconcile errors, by node and phase (add | remove | safety_cap | fetch_actual | fetch_expected)',
            labelNames: ['node_uuid', 'phase'],
        }),
);

export const reconcileRunsTotal = getOrRegister(
    'compono_reconcile_runs_total',
    () =>
        new Counter({
            name: 'compono_reconcile_runs_total',
            help: 'Total reconcile invocations, by node and outcome (ok | skipped | error)',
            labelNames: ['node_uuid', 'outcome'],
        }),
);
