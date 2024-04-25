import { spawn } from 'child_process';

if (process.env['TAGTOOL_GITHUB_PAT'] === undefined) {
  console.error('TAGTOOL_GITHUB_PAT is not set');
  process.exit(1);
}

const appArg = 2;

console.log(`process.argv: ${process.argv}`);

if (process.argv.length <= appArg || process.argv[appArg] === undefined) {
  console.error('tag is not set');
  process.exit(1);
}

if (process.argv.length <= appArg+1 || process.argv[appArg+1] === undefined) {
  console.error('dockerfile is not set');
  process.exit(1);
}

const tag = process.argv[appArg];
const dockerfile = process.argv[appArg+1];
console.log(`Running docker build on ${dockerfile} => ${tag}... `);

const child = spawn('docker',
  ['build', '-t', tag, '--secret', 'id=github,env=TAGTOOL_GITHUB_PAT', '--file', dockerfile, '.']);

child.stdout.on('data', (data) => process.stdout.write(data.toString()));
child.stderr.on('data', (data) => process.stderr.write(data.toString()));

child.on('close', (code: number|null) => {
  if (code !== 0) {
    console.error(`docker process exited with code ${code}`);
    process.exit(code || 0);
  } else {
    console.log('docker process exited successfully');
  }
});
