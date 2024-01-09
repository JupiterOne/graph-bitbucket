import {
  IntegrationError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import {
  BITBUCKET_GROUP_ENTITY_CLASS,
  BITBUCKET_GROUP_ENTITY_TYPE,
  BITBUCKET_GROUP_USER_RELATIONSHIP_TYPE,
  BITBUCKET_USER_ENTITY_TYPE,
  BITBUCKET_USER_GROUP_RELATIONSHIP_TYPE,
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_WORKSPACE_GROUP_RELATIONSHIP_TYPE,
  DATA_USER_BY_ID_MAP,
  INGESTION_SOURCE_IDS,
} from '../constants';
import {
  createGroupEntity,
  createGroupHasUserRelationship,
  createUserOwnsGroupRelationship,
  createWorkspaceHasGroupRelationship,
} from '../sync/converters';
import {
  BitbucketUserEntity,
  BitbucketWorkspaceEntity,
  IdEntityMap,
} from '../types';

export async function fetchGroups(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );

  const userByIdMap =
    await jobState.getData<IdEntityMap<BitbucketUserEntity>>(
      DATA_USER_BY_ID_MAP,
    );

  if (!userByIdMap) {
    throw new IntegrationError({
      code: 'DATA_NOT_FOUND',
      message: "Required data not found in job state: 'USER_BY_UUID_MAP'",
    });
  }

  await jobState.iterateEntities(
    {
      _type: BITBUCKET_WORKSPACE_ENTITY_TYPE,
    },
    async (workspaceEntity) => {
      if (workspaceEntity.slug) {
        const slug: string = <string>workspaceEntity.slug;
        await apiClient.iterateGroups(slug, async (group) => {
          const groupEntity = createGroupEntity(group);
          await jobState.addEntity(groupEntity); // TODO: https://github.com/JupiterOne/sdk/issues/497

          const workspace: BitbucketWorkspaceEntity = <
            BitbucketWorkspaceEntity
          >workspaceEntity;
          await jobState.addRelationship(
            createWorkspaceHasGroupRelationship(workspace, groupEntity),
          );

          for (const user of group.members) {
            if (user.uuid) {
              if (userByIdMap[user.uuid]) {
                await jobState.addRelationship(
                  createGroupHasUserRelationship(
                    groupEntity,
                    userByIdMap[user.uuid],
                  ),
                );
              }
            }
          }

          const owner = group.owner;
          if (owner.uuid) {
            if (userByIdMap[owner.uuid]) {
              await jobState.addRelationship(
                createUserOwnsGroupRelationship(
                  userByIdMap[owner.uuid],
                  groupEntity,
                ),
              );
            }
          }
        });
      }
    },
  );
}

export const groupSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-groups',
    name: 'Fetch Groups',
    entities: [
      {
        resourceName: 'Bitbucket Group',
        _type: BITBUCKET_GROUP_ENTITY_TYPE,
        _class: BITBUCKET_GROUP_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_WORKSPACE_GROUP_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_WORKSPACE_ENTITY_TYPE,
        targetType: BITBUCKET_GROUP_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_GROUP_USER_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_GROUP_ENTITY_TYPE,
        targetType: BITBUCKET_USER_ENTITY_TYPE,
      },
      {
        _type: BITBUCKET_USER_GROUP_RELATIONSHIP_TYPE,
        _class: RelationshipClass.OWNS,
        sourceType: BITBUCKET_USER_ENTITY_TYPE,
        targetType: BITBUCKET_GROUP_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-users', 'fetch-workspaces'],
    executionHandler: fetchGroups,
    ingestionSourceId: INGESTION_SOURCE_IDS.GROUPS,
  },
];
