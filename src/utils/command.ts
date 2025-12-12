import { exec } from '@actions/exec';

export async function executeCommand(
  command: string,
  args: string[],
): Promise<string> {
  let stderr = '';
  let stdout = '';

  const exitCode = await exec(command, args, {
    ignoreReturnCode: true,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      },
      stderr: (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      },
    },
  });

  if (exitCode !== 0) {
    throw new Error(
      stderr ||
        `Command failed with exit code ${exitCode}: ${command} ${args.join(' ')}`,
    );
  }

  return stdout.trim();
}
