import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import {
  createProjectEntity,
  createWorkspaceOwnsProjectRelationship,
} from '../sync/converters';
import {
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_PROJECT_ENTITY_TYPE,
  BITBUCKET_PROJECT_ENTITY_CLASS,
  BITBUCKET_WORKSPACE_PROJECT_RELATIONSHIP_TYPE,
} from '../constants';
import { BitbucketWorkspaceEntity, BitbucketProjectEntity } from '../types';

export async function fetchProjects(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );

  await jobState.iterateEntities(
    {
      _type: BITBUCKET_WORKSPACE_ENTITY_TYPE,
    },
    async (workspaceEntity) => {
      if (workspaceEntity.slug) {
        const slug: string = <string>workspaceEntity.slug;
        await apiClient.iterateProjects(slug, async (project) => {
          const projectEntity = (await jobState.addEntity(
            createIntegrationEntity({
              entityData: {
                source: project,
                assign: createProjectEntity(slug, project),
              },
            }),
          )) as BitbucketProjectEntity;
          const workspace: BitbucketWorkspaceEntity = <
            BitbucketWorkspaceEntity
          >workspaceEntity;
          await jobState.addRelationship(
            createWorkspaceOwnsProjectRelationship(workspace, projectEntity),
          );
        });
      }
    },
  );
}

export const projectSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-projects',
    name: 'Fetch Projects',
    entities: [
      {
        resourceName: 'Bitbucket Project',
        _type: BITBUCKET_PROJECT_ENTITY_TYPE,
        _class: [BITBUCKET_PROJECT_ENTITY_CLASS],
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_WORKSPACE_PROJECT_RELATIONSHIP_TYPE,
        _class: RelationshipClass.OWNS,
        sourceType: BITBUCKET_WORKSPACE_ENTITY_TYPE,
        targetType: BITBUCKET_PROJECT_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-workspaces'],
    executionHandler: fetchProjects,
  },
];
