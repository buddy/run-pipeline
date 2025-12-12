import { getInput, info, setFailed, setSecret } from '@actions/core';
import { exec } from '@actions/exec';
import { ensureBdyInstalled } from '@/bdy';

function checkBuddyLogin(): { token: string; endpoint: string } {
  const token = process.env.BUDDY_TOKEN;
  const endpoint = process.env.BUDDY_API_ENDPOINT;

  if (!token) {
    throw new Error(
      'BUDDY_TOKEN is not set. Please use the buddy/login@v1 action before running pipelines.',
    );
  }

  if (!endpoint) {
    throw new Error(
      'BUDDY_API_ENDPOINT is not set. Please use the buddy/login@v1 action before running pipelines.',
    );
  }

  setSecret(token);
  info('Buddy credentials found');
  return { token, endpoint };
}

async function runPipeline(
  workspace: string,
  project: string,
  identifier: string,
  token: string,
  _apiEndpoint: string,
): Promise<void> {
  info(`Running pipeline: ${identifier} in ${workspace}/${project}`);

  const args = [
    'pipeline',
    'run',
    identifier,
    '--workspace',
    workspace,
    '--project',
    project,
    '--token',
    token,
    'region',
    'eu',
  ];

  let stderr = '';
  const exitCode = await exec('bdy', args, {
    ignoreReturnCode: true,
    listeners: {
      stderr: (data: Buffer) => {
        stderr += data.toString();
      },
    },
  });

  if (exitCode !== 0) {
    throw new Error(stderr || `bdy command failed with exit code ${exitCode}`);
  }
}

async function run(): Promise<void> {
  try {
    await ensureBdyInstalled();
    const { token, endpoint } = checkBuddyLogin();

    const workspace = getInput('workspace', { required: true });
    const project = getInput('project', { required: true });
    const identifier = getInput('identifier', { required: true });

    await runPipeline(workspace, project, identifier, token, endpoint);

    info('Pipeline run initiated successfully');
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed('An unknown error occurred');
    }
  }
}

run();
