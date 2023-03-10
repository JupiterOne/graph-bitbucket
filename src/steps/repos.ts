import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import {
  createRepoEntity,
  createWorkspaceOwnsRepoRelationship,
  createProjectHasRepoRelationship,
} from '../sync/converters';
import {
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_PROJECT_ENTITY_TYPE,
  BITBUCKET_REPO_ENTITY_TYPE,
  BITBUCKET_REPO_ENTITY_CLASS,
  BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE,
} from '../constants';
import {
  BitbucketWorkspaceEntity,
  BitbucketProjectEntity,
  BitbucketRepoEntity,
} from '../types';

export async function fetchRepos(
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
      const workspaceUuid: string = workspaceEntity._key;
      await apiClient.iterateRepos(workspaceUuid, async (repo) => {
        const repoEntity = (await jobState.addEntity(
          createIntegrationEntity({
            entityData: {
              source: repo,
              assign: createRepoEntity(workspaceUuid, repo),
            },
          }),
        )) as BitbucketRepoEntity;

        const workspace: BitbucketWorkspaceEntity = <BitbucketWorkspaceEntity>(
          workspaceEntity
        );
        await jobState.addRelationship(
          createWorkspaceOwnsRepoRelationship(workspace, repoEntity),
        );

        //go get the project entity and map a relationship
        if (repo.project) {
          const projectEntity = (await jobState.findEntity(
            repo.project.uuid,
          )) as BitbucketProjectEntity;
          if (!projectEntity) {
            throw new IntegrationMissingKeyError(
              `Expected Project with key to exist (key=${repo.project.uuid}) as part of Repo (key=${repo.uuid})`,
            );
          }
          await jobState.addRelationship(
            createProjectHasRepoRelationship(projectEntity, repoEntity),
          );
        }
      });
    },
  );
}

export const repoSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-repos',
    name: 'Fetch Repos',
    entities: [
      {
        resourceName: 'Bitbucket Repo',
        _type: BITBUCKET_REPO_ENTITY_TYPE,
        _class: [BITBUCKET_REPO_ENTITY_CLASS],
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE,
        _class: RelationshipClass.OWNS,
        sourceType: BITBUCKET_WORKSPACE_ENTITY_TYPE,
        targetType: BITBUCKET_REPO_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_PROJECT_ENTITY_TYPE,
        targetType: BITBUCKET_REPO_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-projects'],
    executionHandler: fetchRepos,
  },
];
