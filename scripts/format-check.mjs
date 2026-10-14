#!/usr/bin/env node
// `prettier --check` for apps/ and packages/. Inside GitHub Actions, when files
// are not formatted, it also reformats them in the (throwaway) CI checkout and
// emits the resulting diff as annotations, so the exact change Prettier wants
// is readable through the Checks API. Exit code is that of the check.
import { spawnSync } from 'node:child_process';

const glob = '{apps,packages}/**/*.{ts,json,yaml}';
const check = spawnSync('pnpm', ['exec', 'prettier', '--check', glob], {
  encoding: 'utf8',
});
process.stdout.write(check.stdout ?? '');
process.stderr.write(check.stderr ?? '');
const code = check.status ?? 1;

if (code !== 0 && process.env.GITHUB_ACTIONS === 'true') {
  const files = `${check.stdout ?? ''}\n${check.stderr ?? ''}`
    .split('\n')
    .map((l) => /^\[warn\] (\S+\.(?:ts|json|yaml))$/.exec(l.trim())?.[1])
    .filter((f) => typeof f === 'string');
  if (files.length > 0) {
    spawnSync('pnpm', ['exec', 'prettier', '--write', ...files], {
      encoding: 'utf8',
    });
    const diff = spawnSync('git', ['diff', '-U0', '--', ...files], {
      encoding: 'utf8',
    }).stdout;
    const chunks = [];
    for (let i = 0; i < diff.length && chunks.length < 18; i += 3000) {
      chunks.push(diff.slice(i, i + 3000));
    }
    chunks.forEach((chunk, i) =>
      print(i < 9 ? 'error' : 'warning', `format-diff ${i + 1}/${chunks.length}`, chunk),
    );
  }
}
process.exitCode = code;

function print(level, title, message) {
  const escape = (s) =>
    s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const escapeProp = (s) =>
    escape(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
  console.log(`::${level} title=${escapeProp(title)}::${escape(message)}`);
}
