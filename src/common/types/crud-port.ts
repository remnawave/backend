export interface ICrud<ENTITY> {
    create: (entity: ENTITY) => Promise<ENTITY>;
    deleteByUUID: (uuid: string) => Promise<boolean>;
    findByCriteria: (entity: Partial<ENTITY>) => Promise<ENTITY[]>;
    findByUUID: (uuid: string) => Promise<ENTITY | null>;
    update: (entity: ENTITY) => Promise<ENTITY | null>;
}

export interface ICrudWithId<ENTITY> {
    create: (entity: ENTITY) => Promise<ENTITY>;
    deleteById: (id: bigint | number) => Promise<boolean>;
    findByCriteria: (entity: Partial<ENTITY>) => Promise<ENTITY[]>;
    findById: (id: bigint | number) => Promise<ENTITY | null>;
    update: (entity: ENTITY) => Promise<ENTITY | null>;
}

export interface ICrudHistoricalRecords<ENTITY> {
    create: (entity: ENTITY) => Promise<ENTITY>;
    findByCriteria: (entity: Partial<ENTITY>) => Promise<ENTITY[]>;
}

export interface ICrudWithStringId<ENTITY> {
    create: (entity: ENTITY) => Promise<ENTITY>;
    deleteById: (id: string) => Promise<boolean>;
    findByCriteria: (entity: Partial<ENTITY>) => Promise<ENTITY[]>;
    findById: (id: string) => Promise<ENTITY | null>;
    update: (entity: ENTITY) => Promise<ENTITY | null>;
}

export interface ICrudWithName<ENTITY> {
    create: (entity: ENTITY) => Promise<ENTITY>;
    deleteByName: (name: string) => Promise<boolean>;
    findByCriteria?: (entity: Partial<ENTITY>) => Promise<ENTITY[]>;
    findByName: (name: string) => Promise<ENTITY | null>;
    update: (entity: ENTITY) => Promise<ENTITY | null>;
}
