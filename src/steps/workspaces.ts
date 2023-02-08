import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import { createWorkspaceEntity } from '../sync/converters';
import {
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_WORKSPACE_ENTITY_CLASS,
} from '../constants';

export async function fetchWorkspaces(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );

  await apiClient.iterateWorkspaces(async (workspace) => {
    await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: workspace,
          assign: createWorkspaceEntity(workspace),
        },
      }),
    );
  });
}

export const workspaceSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-workspaces',
    name: 'Fetch Workspaces',
    entities: [
      {
        resourceName: 'Bitbucket Workspace',
        _type: BITBUCKET_WORKSPACE_ENTITY_TYPE,
        _class: [BITBUCKET_WORKSPACE_ENTITY_CLASS],
      },
    ],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchWorkspaces,
  },
];
