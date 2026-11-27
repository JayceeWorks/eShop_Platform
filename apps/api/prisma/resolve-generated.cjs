// Prisma's generated client imports its .ts files with .js paths. ts-node doesn't map them,
// so this lets the seed script load the client directly from source.
const Module = require('node:module');
const path = require('node:path');

const GENERATED_DIR = `${path.sep}generated${path.sep}prisma${path.sep}`;
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...rest) {
  const isGeneratedImport =
    request.startsWith('.') &&
    request.endsWith('.js') &&
    parent?.filename?.includes(GENERATED_DIR);
  const target = isGeneratedImport ? request.replace(/\.js$/, '.ts') : request;
  return resolveFilename.call(this, target, parent, ...rest);
};
