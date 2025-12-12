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
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
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
