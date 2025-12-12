import { info, setSecret } from '@actions/core';
import type { PipelineInputs } from '@/types/inputs';
import { executeCommand } from '@/utils/command';

export function checkBuddyCredentials(): void {
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

export async function runPipeline(inputs: PipelineInputs): Promise<void> {
  info(
    `Running pipeline: ${inputs.identifier} in ${inputs.workspace}/${inputs.project}`,
  );

  const args = [
    'pipeline',
    'run',
    inputs.identifier,
    '--workspace',
    inputs.workspace,
    '--project',
    inputs.project,
  ];

  if (inputs.comment) args.push('--comment', inputs.comment);

  const output = await executeCommand('bdy', args);
  if (output) info(output);
}
