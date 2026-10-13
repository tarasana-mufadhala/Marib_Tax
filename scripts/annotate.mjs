#!/usr/bin/env node
// Runs a shell command, streams its output unchanged and keeps its exit code.
// Inside GitHub Actions, when the command fails it also emits workflow
// annotations: TypeScript diagnostics (file(line,col): error TSxxxx: ...) in
// compact chunks, plus the tail of the output. This makes failures readable
// through the Checks API without downloading the full job log.
import { spawn } from 'node:child_process';

const [label, ...commandParts] = process.argv.slice(2);
if (!label || commandParts.length === 0) {
  console.error('usage: node scripts/annotate.mjs <label> <shell command...>');
  process.exit(2);
}

const child = spawn(commandParts.join(' '), {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let captured = '';
const keep = (chunk, stream) => {
  stream.write(chunk);
  captured += chunk.toString();
  if (captured.length > 2_000_000) captured = captured.slice(-1_000_000);
};
child.stdout.on('data', (c) => keep(c, process.stdout));
child.stderr.on('data', (c) => keep(c, process.stderr));

child.on('close', (code) => {
  const exitCode = code ?? 1;
  if (exitCode !== 0 && process.env.GITHUB_ACTIONS === 'true') {
    emit(label, captured);
  }
  process.exitCode = exitCode;
});

function emit(name, output) {
  // eslint-disable-next-line no-control-regex
  const clean = output.replace(/\u001b\[[0-9;]*m/g, '');
  const diagnostics = [
    ...clean.matchAll(/([\w./@-]+\.tsx?)\((\d+),(\d+)\): error (TS\d+): ([^\n]*)/g),
  ].map((m) => `${m[1]}:${m[2]} ${m[4]} ${m[5].slice(0, 180)}`);
  const unique = [...new Set(diagnostics)];

  print('error', `${name}-tail`, clean.slice(-3000));
  if (unique.length > 0) {
    const chunks = [];
    let current = `${unique.length} TypeScript errors`;
    for (const line of unique) {
      if (current.length + line.length + 1 > 3000) {
        chunks.push(current);
        current = '';
      }
      current += (current ? '\n' : '') + line;
    }
    if (current) chunks.push(current);
    chunks.slice(0, 8).forEach((chunk, i) =>
      print('error', `${name}-ts ${i + 1}/${chunks.length}`, chunk),
    );
    chunks.slice(8, 18).forEach((chunk, i) =>
      print('warning', `${name}-ts ${i + 9}/${chunks.length}`, chunk),
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
