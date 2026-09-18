// Client documentation (README.md, readme/**/*.md): every ```ts / ```js block compiles against the packed
// package, every relative link and anchor resolves, and no API route or path appears in it. Needs `dist/` —
// built by `pretest`. What depends on the API contract (error codes, signatures) is not checked here: the
// contract is not in the repository.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

/** Runs a command and returns its stdout, throws with the full output on failure */
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
  if (r.error) {
    throw new Error(`cannot run ${cmd} (${r.error.message}): the documentation tests need npm on the PATH`)
  }
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (status ${r.status})\n${r.stdout}\n${r.stderr}`)
  }
  return r.stdout
}

// ─── Documentation files ──────────────────────────────────────────────────────

/** `*.md` files under a directory, sorted, recursively */
function markdownFiles(dir) {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? markdownFiles(path) : name.endsWith('.md') ? [path] : []
  })
}

/** The client documentation, published with the package: README.md then readme/** */
const docs = [join(root, 'README.md'), ...markdownFiles(join(root, 'readme'))]

/** Fenced code blocks of a markdown text: `{ lang, body }` in order */
function codeBlocks(text) {
  return [...text.matchAll(/^```(\w*)\n([\s\S]*?)^```$/gm)].map(([, lang, body]) => ({ lang, body }))
}

/** A markdown text without its fenced blocks and inline code — where headings and links live */
function prose(text) {
  return text.replace(/^```[\s\S]*?^```$/gm, '').replace(/`[^`\n]*`/g, '')
}

// ─── Throwaway consumer project: `npm pack` → `npm install <tgz>` ─────────────

let consumer

before(() => {
  consumer = mkdtempSync(join(tmpdir(), 'bitgen-sdk-docs-'))
  // --no-dry-run: when the suite runs from `npm publish --dry-run` (prepublishOnly), npm exports its dry-run
  // flag to nested npm commands, which would then write nothing
  const packed = JSON.parse(run(npm, ['pack', '--json', '--no-dry-run', '--pack-destination', consumer], root))
  // npm <= 11 prints an array, npm 12 an object keyed by package name
  const { filename } = Array.isArray(packed) ? packed[0] : Object.values(packed)[0]
  // ESM project: the examples are written with `import`; the ```js (CommonJS) ones become .cjs files
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'doc-consumer', private: true, type: 'module' }))
  run(npm, ['install', '--no-dry-run', '--offline', '--no-audit', '--no-fund', '--no-package-lock', '--ignore-scripts', join(consumer, filename)], consumer)
})

after(() => {
  if (consumer) {
    rmSync(consumer, { recursive: true, force: true })
  }
})

// ─── Examples compile ─────────────────────────────────────────────────────────

// Every example is a module of its own. The documentation assumes a configured `client` (and, in the
// quick start, the `customer` created in step 2); the imports shown by an example apply to the examples
// that follow it on the same page.
const PRELUDE = `import type { BitgenClient as __Client, Created as __Created } from '@bitgen/sdk'
declare const client: __Client
declare const customer: __Created
export {}
`

/** Writes one module per ```ts / ```js block of the documentation into `dir`, returns their names */
function writeSnippets(dir) {
  const names = []
  for (const doc of docs) {
    const page = relative(root, doc)
    const imports = new Map()   // `${type}|${module}` → Set of specifiers, cumulative down the page
    const importLines = () => [...imports].map(([key, specifiers]) => {
      const [type, module] = key.split('|')
      return `import ${type === 'type' ? 'type ' : ''}{ ${[...specifiers].join(', ')} } from '${module}'`
    }).join('\n')
    let n = 0
    for (const { lang, body } of codeBlocks(readFileSync(doc, 'utf8'))) {
      if (lang !== 'ts' && lang !== 'js') {
        continue
      }
      n += 1
      const name = `${page.replace(/[/.]/g, '_')}_${n}`
      if (lang === 'js') {
        writeFileSync(join(dir, `${name}.cjs`), body)
        names.push(`${name}.cjs`)
        continue
      }
      const lines = body.split('\n')
      for (const line of lines.filter((l) => l.startsWith('import '))) {
        const m = /^import (type )?\{ ([^}]+) \} from '([^']+)'$/.exec(line)
        if (!m) {
          throw new Error(`${page}, example ${n}: unsupported import form: ${line}`)
        }
        const key = `${m[1] ? 'type' : 'value'}|${m[3]}`
        if (!imports.has(key)) {
          imports.set(key, new Set())
        }
        for (const specifier of m[2].split(',')) {
          imports.get(key).add(specifier.trim())
        }
      }
      const rest = lines.filter((l) => !l.startsWith('import ')).join('\n')
      writeFileSync(join(dir, `${name}.ts`), `${importLines()}\n${PRELUDE}async function __example() {\n${rest}\n}\nvoid __example\n`)
      names.push(`${name}.ts`)
    }
  }
  return names
}

test('documentation: every ```ts / ```js example compiles against the packed package (strict, node16)', () => {
  const dir = join(consumer, 'examples')
  mkdirSync(dir)
  const names = writeSnippets(dir)
  assert.ok(names.length > 0, 'no example found in the documentation')
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true, module: 'node16', moduleResolution: 'node16', target: 'es2022', lib: ['es2022'],
      // @types/node from the package's own devDependencies (console, Buffer, node:http…)
      types: ['node'], typeRoots: [join(root, 'node_modules', '@types')],
      allowJs: true, checkJs: true, noEmit: true, skipLibCheck: false,
    },
    include: ['examples'],
  }))
  run(process.execPath, [tsc, '-p', 'tsconfig.json'], consumer)
})

// ─── README title ─────────────────────────────────────────────────────────────

test('documentation: the README.md title carries the version of package.json', () => {
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const [title] = readFileSync(join(root, 'README.md'), 'utf8').split('\n')
  assert.equal(title, `# @bitgen/sdk — v${version}`)
})

// ─── No API route or path ─────────────────────────────────────────────────────

// The published documentation is the SDK's, not the API's: no HTTP route (`GET /custody/{user}`) and no bare API
// path (`/customer`, `/bank`…) anywhere in it, code blocks included. The only tolerated occurrence is a data value
// the API returns, listed explicitly.
test('documentation: no API route or path in the published documentation', () => {
  const failures = apiRoutesIn(docs.map((doc) => [relative(root, doc).replace(/\\/g, '/'), readFileSync(doc, 'utf8')]))
  assert.deepEqual(failures, [], 'API routes and paths do not belong to the SDK documentation')
})

/** `page:line: match` for every API route or path found in `[page, text]` pairs, minus the tolerated values */
function apiRoutesIn(pages) {
  const route = /\b(GET|POST|PUT|PATCH|DELETE)\s+\/[^\s`"']*/g
  // a bare API path between backticks or quotes (prose, tables, code blocks alike)
  const path = /[`"']\/(?:customer|account|bank|custody|trading|transaction|staking|applications|webhooks?|organization\/|asset|ticker)(?:[/?{][^`"']*)?[`"']/g
  // the `path` of an ApikeyLog is a value the API returns ("GET /custody/…"), shown as such in apikeys.md
  const allowed = { 'readme/resource/apikeys.md': ['GET /custody/…'] }
  const failures = []
  for (const [page, text] of pages) {
    text.split('\n').forEach((line, index) => {
      for (const pattern of [route, path]) {
        for (const [match] of line.matchAll(pattern)) {
          if (!(allowed[page] ?? []).includes(match)) {
            failures.push(`${page}:${index + 1}: ${match}`)
          }
        }
      }
    })
  }
  return failures
}

test('documentation: the route guard catches routes, with or without backticks, and bare API paths', () => {
  const found = apiRoutesIn([['readme/x.md', [
    'Calls `GET /custody/{user}` under the hood',
    'A POST /trading with `mode`',
    "the path '/bank/{uuid}/withdraw' — and `/customer`",
    'a `DELETE /webhooks/{id}` or `/webhook/security`',
    'nothing here: client.custody.wallet(user, asset), `Api-key`, `/bitgen` in an endpoint URL, "GET /custody/…" only in apikeys.md',
  ].join('\n')]])
  assert.deepEqual(found, [
    'readme/x.md:1: GET /custody/{user}',
    'readme/x.md:2: POST /trading',
    'readme/x.md:3: \'/bank/{uuid}/withdraw\'',
    'readme/x.md:3: `/customer`',
    'readme/x.md:4: DELETE /webhooks/{id}',
    'readme/x.md:4: `/webhook/security`',
    'readme/x.md:5: GET /custody/…',
  ])
  assert.deepEqual(apiRoutesIn([['readme/resource/apikeys.md', 'the `path` ("GET /custody/…") of a call']]), [])
})

// ─── Links and anchors ────────────────────────────────────────────────────────

/** GitHub's anchor of a heading: lowercase, punctuation dropped, spaces → `-` */
function slug(heading) {
  return heading.replace(/`/g, '').trim().toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-')
}

function anchors(path) {
  return [...prose(readFileSync(path, 'utf8')).matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) => slug(heading))
}

test('documentation: relative links and anchors resolve, README.md links every readme/ file', () => {
  const failures = []
  for (const doc of [...docs, join(root, 'CONTRIBUTING.md')]) {
    const page = relative(root, doc)
    for (const [, target] of prose(readFileSync(doc, 'utf8')).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/.test(target)) {
        continue   // absolute URL (https:, mailto:…)
      }
      const [file, anchor] = target.split('#')
      const destination = file ? resolve(dirname(doc), file) : doc
      if (!existsSync(destination)) {
        failures.push(`${page}: broken link ${target}`)
      } else if (anchor !== undefined && !anchors(destination).includes(anchor)) {
        failures.push(`${page}: unknown anchor ${target}`)
      }
    }
  }
  const readme = readFileSync(join(root, 'README.md'), 'utf8')
  for (const doc of docs.slice(1)) {
    const page = relative(root, doc)
    if (!readme.includes(`](${page})`)) {
      failures.push(`README.md does not link ${page}`)
    }
  }
  assert.deepEqual(failures, [])
})
