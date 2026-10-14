#!/usr/bin/env node
// Runs ESLint with --max-warnings=0 semantics and prints the usual "stylish"
// report. When running inside GitHub Actions it also emits a compact summary
// as workflow annotations (rule histogram + per-file locations), so the result
// is readable through the Checks API without downloading the full job log.
import { ESLint } from 'eslint';
import path from 'node:path';

const patterns = process.argv.slice(2);
if (patterns.length === 0) {
  console.error('usage: node scripts/lint-ci.mjs <paths...>');
  process.exit(2);
}

const inActions = process.env.GITHUB_ACTIONS === 'true';

try {
  const eslint = new ESLint({ cwd: process.cwd() });
  const results = await eslint.lintFiles(patterns);
  const errorCount = results.reduce((n, r) => n + r.errorCount, 0);
  const warningCount = results.reduce((n, r) => n + r.warningCount, 0);

  // Annotations first, so a very long report below cannot hide them.
  if (inActions && errorCount + warningCount > 0) {
    emitAnnotations(results, errorCount, warningCount);
  }

  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  if (output) console.log(output);

  process.exitCode = errorCount + warningCount > 0 ? 1 : 0;
} catch (err) {
  const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
  if (inActions) print('error', 'lint-crashed', detail.slice(0, 3800));
  console.error(detail);
  process.exitCode = 2;
}

function emitAnnotations(lintResults, errors, warnings) {
  const shortRule = (id) =>
    (id ?? 'fatal').replace('@typescript-eslint/', 'ts/');

  const histogram = new Map();
  const lines = [];
  for (const result of lintResults) {
    if (result.messages.length === 0) continue;
    const file = path.relative(process.cwd(), result.filePath);
    const entries = result.messages.map((m) => {
      const rule = shortRule(m.ruleId);
      histogram.set(rule, (histogram.get(rule) ?? 0) + 1);
      return `${m.line}:${rule}`;
    });
    lines.push(`${file}|${entries.join(',')}`);
  }

  const summary = [
    `ESLint: ${errors} errors, ${warnings} warnings in ${lines.length} files`,
    ...[...histogram.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([rule, count]) => `${count} ${rule}`),
  ].join('\n');

  // GitHub keeps at most 10 annotations of each level per step.
  const levels = ['error', 'warning', 'notice'];
  const budget = [9, 10, 10];
  // GitHub truncates an annotation message at 4096 characters, so long
  // per-file lines are split into several "file|entries" pieces.
  const chunkSize = 3000;
  const pieces = [];
  for (const line of lines) {
    const [file, rest] = line.split('|');
    let entries = '';
    for (const entry of rest.split(',')) {
      if (file.length + entries.length + entry.length + 2 > chunkSize) {
        pieces.push(`${file}|${entries}`);
        entries = '';
      }
      entries += (entries ? ',' : '') + entry;
    }
    if (entries) pieces.push(`${file}|${entries}`);
  }
  const chunks = [];
  let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length + 1 > chunkSize) {
      chunks.push(current);
      current = '';
    }
    current += (current ? '\n' : '') + piece;
  }
  if (current) chunks.push(current);

  print('error', 'lint-summary', summary);
  let index = 0;
  for (let level = 0; level < levels.length; level += 1) {
    for (let i = 0; i < budget[level] && index < chunks.length; i += 1) {
      print(
        levels[level],
        `lint-files ${index + 1}/${chunks.length}`,
        chunks[index],
      );
      index += 1;
    }
  }
  if (index < chunks.length) {
    print(
      'notice',
      'lint-truncated',
      `${chunks.length - index} more chunks not shown`,
    );
  }
}

function print(level, title, message) {
  const escape = (s) =>
    s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const escapeProp = (s) =>
    escape(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
  console.log(`::${level} title=${escapeProp(title)}::${escape(message)}`);
}
