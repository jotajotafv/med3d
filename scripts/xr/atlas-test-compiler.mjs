import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export function atlasTestCompiler(out) {
  // Compile unchanged production adapters/dependencies for Node; only provide the Vite URL environment.
  const compiled = new Set();
  async function compile(relative) {
    relative = relative.replaceAll('\\', '/'); if (compiled.has(relative)) return; compiled.add(relative);
    const source = await readFile(path.resolve('src', relative), 'utf8'), imports = [...source.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)];
    const resolutions = new Map();
    for (const [, specifier] of imports) {
      let dependency = path.posix.normalize(path.posix.join(path.posix.dirname(relative), specifier));
      if (!/\.tsx?$/.test(dependency)) { try { await readFile(path.join('src', dependency + '.ts')); dependency += '.ts'; } catch { dependency += '.tsx'; } }
      resolutions.set(specifier, specifier.replace(/\.tsx?$/, '') + '.mjs'); await compile(dependency);
    }
    let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    code = code.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (_, q, specifier) => `from ${q}${resolutions.get(specifier)}${q}`).replaceAll('import.meta.env.BASE_URL', "'/med3d/'");
    const file = path.join(out, relative.replace(/\.tsx?$/, '.mjs')); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, code);
  }
  return compile;
}
