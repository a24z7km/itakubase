import {existsSync, mkdtempSync, rmSync, cpSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
const distDir = 'dist';
const tempDir = mkdtempSync(join(tmpdir(), 'itakubase-pages-'));

const run = (command, args, options = {}) => {
  const printable = [command, ...args].join(' ');
  console.log(`$ ${printable}`);
  if (dryRun && options.skipOnDryRun) return;
  execFileSync(command, args, {stdio: 'inherit', ...options});
};

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('dist/index.html が見つかりません。先に npm run build を実行してください。');
  process.exit(1);
}

try {
  run('git', ['worktree', 'add', '--detach', tempDir, 'HEAD']);
  run('git', ['checkout', '--orphan', 'gh-pages'], {cwd: tempDir});
  run('git', ['rm', '-rf', '.'], {cwd: tempDir});

  cpSync(distDir, tempDir, {recursive: true});
  writeFileSync(join(tempDir, '.nojekyll'), '');

  run('git', ['add', '.'], {cwd: tempDir});
  run('git', ['commit', '-m', 'Deploy GitHub Pages'], {cwd: tempDir});
  run('git', ['push', '--force', 'origin', 'HEAD:gh-pages'], {cwd: tempDir, skipOnDryRun: true});

  if (dryRun) {
    console.log('Dry run completed. 実際に公開するには npm run deploy を実行してください。');
  }
} finally {
  run('git', ['worktree', 'remove', '--force', tempDir]);
  rmSync(tempDir, {recursive: true, force: true});
}
