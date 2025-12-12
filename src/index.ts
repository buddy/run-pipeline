import { getInput, info, setFailed, setSecret } from '@actions/core';
import { exec } from '@actions/exec';
import { ensureBdyInstalled } from '@/bdy';

function checkBuddyLogin(): void {
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
}

async function runPipeline(
  workspace: string,
  project: string,
  identifier: string,
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
  ];

  await exec('bdy', args);
}

async function run(): Promise<void> {
  try {
    await ensureBdyInstalled();
    checkBuddyLogin();

    const workspace = getInput('workspace', { required: true });
    const project = getInput('project', { required: true });
    const identifier = getInput('identifier', { required: true });

    await runPipeline(workspace, project, identifier);

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
