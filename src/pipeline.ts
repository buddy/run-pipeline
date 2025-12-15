import { getInput, info, setSecret } from '@actions/core';
import type { PipelineInputs } from '@/types/inputs';
import { executeCommand } from '@/utils/command';

enum PRIORITY {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

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
  const refInfo: string[] = [];
  if (inputs.branch) refInfo.push(`branch '${inputs.branch}'`);
  if (inputs.tag) refInfo.push(`tag '${inputs.tag}'`);
  if (inputs.revision) refInfo.push(`revision '${inputs.revision}'`);
  if (inputs.pullRequest) refInfo.push(`pull request '${inputs.pullRequest}'`);

  const refString = refInfo.length > 0 ? ` (on ${refInfo.join(', ')})` : '';
  info(
    `Running pipeline: ${inputs.identifier} in ${inputs.workspace}/${inputs.project}${refString}`,
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
  if (inputs.branch) args.push('--branch', inputs.branch);
  if (inputs.tag) args.push('--tag', inputs.tag);
  if (inputs.revision) args.push('--revision', inputs.revision);
  if (inputs.pullRequest) args.push('--pull-request', inputs.pullRequest);
  if (inputs.refresh) args.push('--refresh');
  if (inputs.clearCache) args.push('--clear-cache');

  if (inputs.priority) {
    const validPriorities: string[] = Object.values(PRIORITY);
    const upperPriority = inputs.priority.toUpperCase();
    if (!validPriorities.includes(upperPriority)) {
      throw new Error(
        `Invalid priority: "${inputs.priority}". Must be one of: ${validPriorities.join(', ')}`,
      );
    }
    args.push('--priority', upperPriority);
  }

  if (inputs.wait) {
    let wait = Number.parseInt(inputs.wait, 10);
    if (Number.isNaN(wait)) {
      throw new Error(
        `Invalid wait value: "${inputs.wait}". Must be a number.`,
      );
    }

    if (wait < 0) {
      throw new Error('Wait time cannot be negative');
    }

    args.push('--wait', inputs.wait.toString());
  }

  await executeCommand('bdy', args);
}
