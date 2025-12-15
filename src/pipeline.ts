import { info, setSecret } from '@actions/core';
import type { PipelineInputs } from '@/types/inputs';
import { executeCommand } from '@/utils/command';

enum PRIORITY {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

enum REGION {
  EU = 'eu',
  US = 'us',
}

enum VARIABLE_TYPE {
  VARIABLE = 'variable',
  MASKED_VARIABLE = 'masked variable',
}

const VARIABLE_FORMAT_REGEX = /:/;

function parseList(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function validatePriority(priority: string): string {
  const validPriorities: string[] = Object.values(PRIORITY);
  const normalized = priority.toUpperCase();

  if (!validPriorities.includes(normalized)) {
    throw new Error(
      `Invalid priority: "${priority}". Must be one of: ${validPriorities.join(', ')}`,
    );
  }

  return normalized;
}

function validateRegion(region: string): string {
  const validRegions: string[] = Object.values(REGION);
  const normalized = region.toLowerCase();

  if (!validRegions.includes(normalized)) {
    throw new Error(
      `Invalid region: "${region}". Must be one of: ${validRegions.join(', ')}`,
    );
  }

  return normalized;
}

function validateWaitTime(wait: string): number {
  const waitTime = Number.parseInt(wait, 10);

  if (Number.isNaN(waitTime)) {
    throw new Error(`Invalid wait value: "${wait}". Must be a number.`);
  }

  if (waitTime < 0) {
    throw new Error('Wait time cannot be negative');
  }

  return waitTime;
}

function validateVariable(variable: string, type: VARIABLE_TYPE): void {
  if (!VARIABLE_FORMAT_REGEX.test(variable)) {
    throw new Error(
      `Invalid ${type} format: "${variable}". Must be in key:value format.`,
    );
  }
}

function buildReferenceInfo(inputs: PipelineInputs): string {
  const refInfo: string[] = [];

  if (inputs.branch) refInfo.push(`branch '${inputs.branch}'`);
  if (inputs.tag) refInfo.push(`tag '${inputs.tag}'`);
  if (inputs.revision) refInfo.push(`revision '${inputs.revision}'`);
  if (inputs.pullRequest) refInfo.push(`pull request '${inputs.pullRequest}'`);

  return refInfo.length > 0 ? ` (on ${refInfo.join(', ')})` : '';
}

function addSimpleArgs(args: string[], inputs: PipelineInputs): void {
  if (inputs.comment) args.push('--comment', inputs.comment);
  if (inputs.branch) args.push('--branch', inputs.branch);
  if (inputs.tag) args.push('--tag', inputs.tag);
  if (inputs.revision) args.push('--revision', inputs.revision);
  if (inputs.pullRequest) args.push('--pull-request', inputs.pullRequest);
}

function addBooleanFlags(args: string[], inputs: PipelineInputs): void {
  if (inputs.refresh) args.push('--refresh');
  if (inputs.clearCache) args.push('--clear-cache');
}

function addPriority(args: string[], priority: string): void {
  const normalized = validatePriority(priority);
  args.push('--priority', normalized);
}

function addRegion(args: string[], region: string): void {
  const normalized = validateRegion(region);
  const regionKey = Object.entries(REGION).find(
    ([_, value]) => value === normalized,
  )?.[0];

  info(`Overriding region to: ${regionKey}`);
  args.push('--region', normalized);
}

function addVariables(
  args: string[],
  input: string,
  flag: string,
  type: VARIABLE_TYPE,
): void {
  const variables = parseList(input);

  for (const variable of variables) {
    validateVariable(variable, type);
    args.push(flag, variable);
  }
}

function addActions(args: string[], input: string): void {
  const actions = parseList(input);

  for (const action of actions) {
    args.push('--action', action);
  }
}

function addWaitTime(args: string[], wait: string): void {
  validateWaitTime(wait);
  args.push('--wait', wait);
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
  const refInfo = buildReferenceInfo(inputs);
  info(
    `Running pipeline: ${inputs.identifier} in ${inputs.workspace}/${inputs.project}${refInfo}`,
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

  addSimpleArgs(args, inputs);
  addBooleanFlags(args, inputs);

  if (inputs.priority) addPriority(args, inputs.priority);
  if (inputs.region) addRegion(args, inputs.region);
  if (inputs.variable)
    addVariables(args, inputs.variable, '--variable', VARIABLE_TYPE.VARIABLE);
  if (inputs.variableMasked)
    addVariables(
      args,
      inputs.variableMasked,
      '--variable-masked',
      VARIABLE_TYPE.MASKED_VARIABLE,
    );
  if (inputs.schedule) args.push('--schedule', inputs.schedule);
  if (inputs.action) addActions(args, inputs.action);
  if (inputs.wait) addWaitTime(args, inputs.wait);

  await executeCommand('bdy', args);
}
