import {
  IntegrationExecutionContext,
  StepStartStates,
} from '@jupiterone/integration-sdk-core';

import {
  validateInvocation,
  IntegrationConfig,
  sanitizeConfig,
} from './config';

export default async function getStepStartStates(
  context: IntegrationExecutionContext<IntegrationConfig>,
): Promise<StepStartStates> {
  const config = context.instance.config;
  await validateInvocation(context);
  sanitizeConfig(config); //this sets ingestPullRequests no matter what

  return {
    ['fetch-workspaces']: { disabled: false },
    ['fetch-users']: { disabled: false },
    ['fetch-groups']: { disabled: false },
    ['fetch-projects']: { disabled: false },
    ['fetch-repos']: { disabled: false },
    ['fetch-repo-permissions']: { disabled: false },
    ['fetch-repo-branch-restrictions']: { disabled: false },
    ['fetch-prs']: { disabled: !config.ingestPullRequests },
  };
}
