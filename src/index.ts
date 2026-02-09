import { getInput, info, setFailed, warning } from '@actions/core'
import { ensureBdyInstalled } from '@/api/bdy'
import { checkBuddyCredentials, runPipeline } from '@/pipeline'
import type { IInputs } from '@/types/inputs'
import { normalizeError } from '@/utils/error'

function parseBooleanInput(name: string): boolean {
  const value = getInput(name)

  if (!value) {
    return false
  }

  if (value !== 'true' && value !== 'false') {
    warning(
      `Invalid boolean value for '${name}': "${value}". Expected 'true' or 'false'. Treating as false.`,
    )
    return false
  }

  return value === 'true'
}

async function run(): Promise<void> {
  await ensureBdyInstalled()
  checkBuddyCredentials()

  const inputs: IInputs = {
    workspace: getInput('workspace', { required: true }),
    project: getInput('project', { required: true }),
    identifier: getInput('identifier', { required: true }),
    comment: getInput('comment') || undefined,
    wait: getInput('wait') || undefined,
    branch: getInput('branch') || undefined,
    tag: getInput('tag') || undefined,
    revision: getInput('revision') || undefined,
    pullRequest: getInput('pull-request') || undefined,
    refresh: parseBooleanInput('refresh'),
    clearCache: parseBooleanInput('clear-cache'),
    priority: getInput('priority') || undefined,
    variable: getInput('variable') || undefined,
    variableMasked: getInput('variable-masked') || undefined,
    schedule: getInput('schedule') || undefined,
    action: getInput('action') || undefined,
  }

  await runPipeline(inputs)

  if (!inputs.wait) info('Pipeline run initiated successfully')
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error: unknown) => {
    setFailed(normalizeError(error))
    process.exit(1)
  })
