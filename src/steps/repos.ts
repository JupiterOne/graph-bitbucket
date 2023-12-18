import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
  createDirectRelationship,
  IntegrationWarnEventName,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import {
  createRepoEntity,
  createWorkspaceOwnsRepoRelationship,
  createProjectHasRepoRelationship,
  createPermissionEntity,
  createGroupKey,
  createBranchRestriction,
} from '../sync/converters';
import {
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_PROJECT_ENTITY_TYPE,
  BITBUCKET_REPO_ENTITY_TYPE,
  BITBUCKET_REPO_ENTITY_CLASS,
  BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_PERMISSION_ENTITY_TYPE,
  BITBUCKET_GROUP_ENTITY_TYPE,
  BITBUCKET_USER_ENTITY_TYPE,
  BITBUCKET_PERMISSION_ENTITY_CLASS,
  BITBUCKET_PERMISSION_GROUP_RELATIONSHIP_TYPE,
  BITBUCKET_PERMISSION_USER_RELATIONSHIP_TYPE,
  BITBUCKET_PERMISSION_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
  BITBUCKET_BRANCH_RESTRICTION_ENTITY_CLASS,
  BITBUCKET_BRANCH_RESTRICTION_GROUP_RELATIONSHIP_TYPE,
  BITBUCKET_BRANCH_RESTRICTION_USER_RELATIONSHIP_TYPE,
  BITBUCKET_BRANCH_RESTRICTION_REPO_RELATIONSHIP_TYPE,
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

export async function fetchRepoPermissions(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );
  try {
    await jobState.iterateEntities(
      {
        _type: BITBUCKET_REPO_ENTITY_TYPE,
      },
      async (repoEntity) => {
        const repoKey = repoEntity._key;
        const workspaceUuid = (repoEntity as any).ownerId;
        await apiClient.iterateRepoGroupPermissions(
          workspaceUuid,
          repoKey,
          async (permission) => {
            const permEntity = createPermissionEntity(
              workspaceUuid,
              repoKey,
              permission,
            );
            await jobState.addEntity(permEntity);
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.ALLOWS,
                fromKey: repoKey,
                fromType: BITBUCKET_REPO_ENTITY_TYPE,
                toKey: permEntity._key,
                toType: BITBUCKET_PERMISSION_ENTITY_TYPE,
              }),
            );
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                fromKey: (permEntity as any).principalKey,
                fromType: BITBUCKET_GROUP_ENTITY_TYPE,
                toKey: permEntity._key,
                toType: BITBUCKET_PERMISSION_ENTITY_TYPE,
              }),
            );
          },
        );
        await apiClient.iterateRepoUserPermissions(
          (repoEntity as any).ownerId,
          repoEntity._key,
          async (permission) => {
            const permEntity = createPermissionEntity(
              workspaceUuid,
              repoKey,
              permission,
            );
            await jobState.addEntity(permEntity);
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.ALLOWS,
                fromKey: repoKey,
                fromType: BITBUCKET_REPO_ENTITY_TYPE,
                toKey: permEntity._key,
                toType: BITBUCKET_PERMISSION_ENTITY_TYPE,
              }),
            );
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                fromKey: (permEntity as any).principalKey,
                fromType: BITBUCKET_USER_ENTITY_TYPE,
                toKey: permEntity._key,
                toType: BITBUCKET_PERMISSION_ENTITY_TYPE,
              }),
            );
          },
        );
      },
    );
  } catch (error) {
    try {
      if (JSON.parse(error.code).status == 403) {
        context.logger.publishWarnEvent({
          name: IntegrationWarnEventName.MissingPermission,
          description:
            'Found a missing permission. Please add Repositories Admin permission to the Oauth consumer.',
        });
      } else {
        throw error;
      }
    } catch (secondError) {
      // This is added in case the json.parse fails. We should rethrow the original issue.
      throw error;
    }
  }
}

export async function fetchRepoBranchRestrictions(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );
  try {
    await jobState.iterateEntities(
      {
        _type: BITBUCKET_REPO_ENTITY_TYPE,
      },
      async (repoEntity) => {
        const repoKey = repoEntity._key;
        const workspaceUuid = (repoEntity as any).ownerId;
        await apiClient.iterateRepoBranchRestrictions(
          workspaceUuid,
          repoKey,
          async (branchRestriction) => {
            const branchRestrictionEntity = createBranchRestriction(
              workspaceUuid,
              repoKey,
              branchRestriction,
            );
            await jobState.addEntity(branchRestrictionEntity);
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                fromKey: repoKey,
                fromType: BITBUCKET_REPO_ENTITY_TYPE,
                toKey: branchRestrictionEntity._key,
                toType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
              }),
            );
            for (const user of branchRestriction.users) {
              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.ALLOWS,
                  fromKey: branchRestrictionEntity._key,
                  fromType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
                  toKey: user.uuid,
                  toType: BITBUCKET_USER_ENTITY_TYPE,
                }),
              );
            }
            for (const group of branchRestriction.groups) {
              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.ALLOWS,
                  fromKey: branchRestrictionEntity._key,
                  fromType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
                  toKey: createGroupKey(group.slug),
                  toType: BITBUCKET_GROUP_ENTITY_TYPE,
                }),
              );
            }
          },
        );
      },
    );
  } catch (error) {
    try {
      if (JSON.parse(error.code).status == 403) {
        context.logger.publishWarnEvent({
          name: IntegrationWarnEventName.MissingPermission,
          description:
            'Found a missing permission. Please add Repositories Admin permission to the Oauth consumer.',
        });
      } else {
        throw error;
      }
    } catch (secondError) {
      // This is added in case the json.parse fails. We should rethrow the original issue.
      throw error;
    }
  }
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
  {
    id: 'fetch-repo-permissions',
    name: 'Fetch Repository Permissions',
    entities: [
      {
        resourceName: 'Bitbucket Permission',
        _type: BITBUCKET_PERMISSION_ENTITY_TYPE,
        _class: [BITBUCKET_PERMISSION_ENTITY_CLASS],
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_PERMISSION_GROUP_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_GROUP_ENTITY_TYPE,
        targetType: BITBUCKET_PERMISSION_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_PERMISSION_USER_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_USER_ENTITY_TYPE,
        targetType: BITBUCKET_PERMISSION_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_PERMISSION_REPO_RELATIONSHIP_TYPE,
        _class: RelationshipClass.ALLOWS,
        sourceType: BITBUCKET_REPO_ENTITY_TYPE,
        targetType: BITBUCKET_PERMISSION_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-repos', 'fetch-users', 'fetch-groups'],
    executionHandler: fetchRepoPermissions,
  },
  {
    id: 'fetch-repo-branch-restrictions',
    name: 'Fetch Repository Branch Restrictions',
    entities: [
      {
        resourceName: 'Bitbucket Branch Restriction',
        _type: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
        _class: [BITBUCKET_BRANCH_RESTRICTION_ENTITY_CLASS],
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_BRANCH_RESTRICTION_GROUP_RELATIONSHIP_TYPE,
        _class: RelationshipClass.ALLOWS,
        sourceType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
        targetType: BITBUCKET_GROUP_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_BRANCH_RESTRICTION_USER_RELATIONSHIP_TYPE,
        _class: RelationshipClass.ALLOWS,
        sourceType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
        targetType: BITBUCKET_USER_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_BRANCH_RESTRICTION_REPO_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_REPO_ENTITY_TYPE,
        targetType: BITBUCKET_BRANCH_RESTRICTION_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-repos', 'fetch-users', 'fetch-groups'],
    executionHandler: fetchRepoBranchRestrictions,
  },
];
