import fs from 'fs';
import path from 'path';

// list of node_modules that are shipped inside the container
const prodDeps = ['@bull-board/ui', '@prisma/client', 'class-transformer', 'class-validator', 'prisma', 'zod'];

const targets = [
  { entry: 'dist/src/main.js', out: 'bundle/main.js' },
  { entry: 'dist/src/bin/cli/cli.js', out: 'bundle/cli.js' },
  { entry: 'dist/src/bin/processors/processors.js', out: 'bundle/processors.js' },
  { entry: 'dist/src/bin/scheduler/scheduler.js', out: 'bundle/scheduler.js' },
  { entry: 'prisma/seed/config.seed.js', out: 'bundle/config.seed.js', dest: 'dist/prisma/seed/config.seed.js' },
];

// create minimal package.json with the same version as currently set only for the packages that had trouble being bundled
if (process.argv.includes('--create-deps')) {
  const prodModulesDir = '/opt/app/prod_modules';
  fs.mkdirSync(prodModulesDir, { recursive: true });

  const mainPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const allDeps = { ...mainPkg.dependencies, ...mainPkg.devDependencies };
  const pkg = {
    type: 'module',
    dependencies: Object.fromEntries(prodDeps.filter(k => allDeps[k]).map(k => [k, allDeps[k]]))
  };

  fs.writeFileSync(path.join(prodModulesDir, 'package.json'), JSON.stringify(pkg, null, 2));
  process.exit(0);
}

// copy out the bundled files to their previous locations
if (process.argv.includes('--copy-bundled-executables')) {
  const bundleDir = '/opt/app/bundle';
  targets.forEach(({ entry, out, dest }) => {
    const srcFile = path.join(bundleDir, path.basename(out));
    const destFile = dest || entry;
    const destDir = path.dirname(destFile);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);
  });
  process.exit(0);
}

const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  minify: true,
  keepNames: true,
  minifySyntax: false,
  treeShaking: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  metafile: true,
  logLevel: 'info',
  external: [
    ...prodDeps,
    '@fastify/static',
    '@mikro-orm/core',
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/mongoose',
    '@nestjs/sequelize/dist/common/sequelize.utils',
    '@nestjs/typeorm/dist/common/typeorm.utils',
    '@nestjs/websockets/socket-module',
    '@remnawave/*',
    'blessed',
    'pm2-deploy',
    'pty.js',
    'term.js',
  ]
};

if (process.argv.includes('--build')) {
  const { build } = await import('esbuild');

  await Promise.all(targets.map(({ entry, out }) =>
    build({
      ...commonOptions,
      entryPoints: [entry],
      outfile: out
    })
  ));
}