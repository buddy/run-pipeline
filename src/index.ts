import { getInput, info, setFailed } from '@actions/core';
import { ensureBdyInstalled } from '@/api/bdy';
import { checkBuddyCredentials, runPipeline } from '@/pipeline';
import type { PipelineInputs } from '@/types/inputs';
import { normalizeError } from '@/utils/error';

async function run(): Promise<void> {
  await ensureBdyInstalled();
  checkBuddyCredentials();

  const inputs: PipelineInputs = {
    workspace: getInput('workspace', { required: true }),
    project: getInput('project', { required: true }),
    identifier: getInput('identifier', { required: true }),
    comment: getInput('comment') || undefined,
    wait: getInput('wait') || undefined,
    branch: getInput('branch') || undefined,
    tag: getInput('tag') || undefined,
    revision: getInput('revision') || undefined,
    pullRequest: getInput('pull-request') || undefined,
    refresh: getInput('refresh') === 'true',
    clearCache: getInput('clear-cache') === 'true',
    priority: getInput('priority') || undefined,
  };

  await runPipeline(inputs);

  if (!inputs.wait) info('Pipeline run initiated successfully');
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    setFailed(normalizeError(error));
    process.exit(1);
  });
