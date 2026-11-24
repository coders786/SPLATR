// Launch the AL2023 chromium on this non-Lambda Debian box.
import chromium, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
const bin = join(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..', 'bin');
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

await inflate(join(bin, 'al2023.tar.br'));   // AL2023 shared libs -> $TMPDIR/al2023
await inflate(join(bin, 'fonts.tar.br'));    // fonts -> $TMPDIR/fonts
setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
const executablePath = await chromium.executablePath();
console.log('executablePath:', executablePath);
console.log('LD_LIBRARY_PATH:', process.env.LD_LIBRARY_PATH);
console.log('FONTCONFIG_PATH:', process.env.FONTCONFIG_PATH);
console.log('args:', chromium.args.join(' '));
