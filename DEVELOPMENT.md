1. Launch the database and redis containers:

```bash
docker compose -f docker-compose-db-local.yml up -d
```

2. Install dependencies:

```bash
npm install
```

3. Migrate the database:

```bash
npm run migrate:deploy
```

4. Generate types:

```bash
npm run migrate:generate
```

5. Seed the database:

```bash
npm run seed:dev
```

6. Running dev mode (if you run multiple instances, make sure to wait before starting the next instance):

- API:

```bash
npm run dev:api
```

- Worker:

```bash
npm run dev:worker
```

- Scheduler:

```bash
npm run dev:scheduler
```
