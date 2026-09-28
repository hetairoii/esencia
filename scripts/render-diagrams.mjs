#!/usr/bin/env node
/**
 * Extrae cada bloque ```mermaid de docs/diagramas/*.md y lo exporta a PNG y SVG
 * en docs/diagramas/export/ usando @mermaid-js/mermaid-cli (mmdc).
 *
 * Uso:
 *   npm run diagrams            # genera los PNG/SVG
 *   npm run diagrams:check      # solo valida sintaxis (no escribe archivos), útil en CI
 *
 * Motivo de mantener esto como script propio en vez de un workflow ad-hoc:
 * así el mismo comando se puede correr en local y en CI (docs/10-guia-diagramas.md).
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const DIAGRAMS_DIR = join(process.cwd(), "docs", "diagramas");
const EXPORT_DIR = join(DIAGRAMS_DIR, "export");
const CHECK_ONLY = process.argv.includes("--check-only");

/**
 * Se invoca el CLI de mermaid con `node <cli.js>` en vez de `npx`/`mmdc`
 * directamente: en Windows, npx/mmdc se instalan como .cmd, y ejecutar un
 * .cmd sin shell:true falla (EINVAL); pero shell:true rompe cuando alguna
 * ruta de argumento tiene espacios (frecuente aquí: "Computación en la
 * nube"), porque el shell las trocea. Invocar `node.exe` con un array de
 * argumentos evita ambos problemas: no hay .cmd de por medio y cada
 * argumento llega intacto, con espacios y todo.
 *
 * Se construye la ruta directamente (en vez de `require.resolve`) porque el
 * "exports" map de @mermaid-js/mermaid-cli no expone `src/cli.js` como
 * subpath público, aunque sí es el archivo real que declara como su propio
 * `bin`.
 */
const mmdcBin = join(process.cwd(), "node_modules", "@mermaid-js", "mermaid-cli", "src", "cli.js");
if (!existsSync(mmdcBin)) {
  console.error(
    `No se encontró ${mmdcBin}.\nCorré "npm install" en la raíz del repo (package.json declara @mermaid-js/mermaid-cli como devDependency).`,
  );
  process.exit(1);
}
const execOptions = { stdio: "pipe" };

/**
 * mermaid-cli usa Puppeteer con un Chromium propio, cuya descarga puede estar
 * bloqueada o no valer la pena en una máquina que ya tiene un navegador
 * instalado. Si se encuentra uno de estos ejecutables (o PUPPETEER_EXECUTABLE_PATH
 * ya está definida), se genera un puppeteer-config.json temporal y se le pasa
 * a mmdc con `-p`, reutilizando ese navegador en vez de descargar Chromium.
 */
function findPuppeteerConfigFile() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);

  const executablePath = candidates.find((p) => existsSync(p));
  if (!executablePath) return null;

  const configPath = join(tmpdir(), "esencia-puppeteer-config.json");
  writeFileSync(configPath, JSON.stringify({ executablePath }), "utf-8");
  return configPath;
}

const puppeteerConfigFile = findPuppeteerConfigFile();
const puppeteerArgs = puppeteerConfigFile ? ["-p", puppeteerConfigFile] : [];

function extractMermaidBlocks(markdown) {
  const blocks = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function main() {
  if (!existsSync(DIAGRAMS_DIR)) {
    console.error(`No existe ${DIAGRAMS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(DIAGRAMS_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.warn("No se encontraron archivos .md en docs/diagramas/");
    return;
  }

  if (!CHECK_ONLY) {
    rmSync(EXPORT_DIR, { recursive: true, force: true });
    mkdirSync(EXPORT_DIR, { recursive: true });
  }

  let total = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = join(DIAGRAMS_DIR, file);
    const content = readFileSync(fullPath, "utf-8");
    const blocks = extractMermaidBlocks(content);

    if (blocks.length === 0) {
      console.warn(`⚠ ${file}: no contiene bloques \`\`\`mermaid`);
      continue;
    }

    blocks.forEach((block, idx) => {
      total += 1;
      const id = basename(file, ".md") + (blocks.length > 1 ? `-${idx + 1}` : "");
      const tmpFile = join(tmpdir(), `${id}.mmd`);
      writeFileSync(tmpFile, block, "utf-8");

      try {
        if (CHECK_ONLY) {
          // mmdc no tiene modo "solo validar": renderizamos a un SVG temporal y lo descartamos.
          const tmpOut = join(tmpdir(), `${id}.svg`);
          execFileSync(
            process.execPath,
            [mmdcBin, ...puppeteerArgs, "-i", tmpFile, "-o", tmpOut],
            execOptions,
          );
          rmSync(tmpOut, { force: true });
        } else {
          const pngOut = join(EXPORT_DIR, `${id}.png`);
          const svgOut = join(EXPORT_DIR, `${id}.svg`);
          execFileSync(
            process.execPath,
            [mmdcBin, ...puppeteerArgs, "-i", tmpFile, "-o", pngOut],
            execOptions,
          );
          execFileSync(
            process.execPath,
            [mmdcBin, ...puppeteerArgs, "-i", tmpFile, "-o", svgOut],
            execOptions,
          );
        }
        console.log(`✔ ${id}`);
      } catch (err) {
        failed += 1;
        console.error(`✘ ${id}: ${err.message}`);
      } finally {
        rmSync(tmpFile, { force: true });
      }
    });
  }

  console.log(`\n${total - failed}/${total} diagramas ${CHECK_ONLY ? "válidos" : "exportados"}.`);
  if (failed > 0) process.exit(1);
}

main();
