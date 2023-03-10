import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import collectCommitsForPR from '../sync/approval/collectCommitsForPR';
import { calculatePRRequestFilter } from '../sync/helpers';
import {
  createPrEntity,
  PRConverterInput,
  createRepoHasPrRelationship,
  createUserOpenedPrRelationship,
  createUserApprovedPrRelationship,
  createUserReviewedPrRelationship,
} from '../sync/converters';
import {
  BITBUCKET_USER_ENTITY_TYPE,
  BITBUCKET_REPO_ENTITY_TYPE,
  BITBUCKET_PR_ENTITY_TYPE,
  BITBUCKET_PR_ENTITY_CLASSES,
  BITBUCKET_REPO_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_OPENED_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_APPROVED_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_REVIEWED_PR_RELATIONSHIP_TYPE,
  DATA_USER_BY_ID_MAP,
  DATA_USER_ID_ARRAY,
} from '../constants';
import {
  IdEntityMap,
  BitbucketUserEntity,
  BitbucketPullRequestEntity,
  BitbucketRepoEntity,
} from '../types';

export async function fetchPRs(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );

  const userByIdMap = await jobState.getData<IdEntityMap<BitbucketUserEntity>>(
    DATA_USER_BY_ID_MAP,
  );

  if (!userByIdMap) {
    throw new IntegrationError({
      code: 'DATA_NOT_FOUND',
      message: "Required data not found in job state: 'USER_BY_UUID_MAP'",
    });
  }

  const userIds = await jobState.getData<string[]>(DATA_USER_ID_ARRAY);

  if (!userIds) {
    throw new IntegrationError({
      code: 'DATA_NOT_FOUND',
      message: "Required data not found in job state: 'USER_ID_ARRAY'",
    });
  }

  await jobState.iterateEntities(
    {
      _type: BITBUCKET_REPO_ENTITY_TYPE,
    },
    async (repoEntity) => {
      const workspaceUuid: string = <string>repoEntity.ownerId;
      const lastSuccessfulSyncTime = context.executionHistory.lastSuccessful
        ?.startedOn
        ? context.executionHistory.lastSuccessful?.startedOn
        : null;
      const requestFilter = calculatePRRequestFilter(lastSuccessfulSyncTime);
      await apiClient.iteratePRs(
        workspaceUuid,
        repoEntity._key,
        requestFilter,
        async (pr) => {
          //prApprovalData code from the old integration syncContext.ts, loadPullRequestsFromBitBucket()
          const prApprovalData = await collectCommitsForPR(
            apiClient.bitbucket,
            context.logger,
            workspaceUuid,
            userIds,
            pr,
          );
          //prConverterInput code from the old integration syncContext.ts, loadPullRequestsFromBitBucket()
          const prConverterInput: PRConverterInput = {
            accountUUID: workspaceUuid,
            pullRequest: pr,
            commits: prApprovalData.allCommits,
            commitsApproved: prApprovalData.approvedCommits,
            commitsByUnknownAuthor: prApprovalData.commitsByUnknownAuthor,
            approvals: prApprovalData.approvals,
            approvedCommitsRemoved: prApprovalData.approvedCommitsRemoved,
            usersByUUID: userByIdMap,
          };
          const convertedPR = createPrEntity(prConverterInput);
          const prEntity = (await jobState.addEntity(
            createIntegrationEntity({
              entityData: {
                source: pr,
                assign: convertedPR,
              },
            }),
          )) as BitbucketPullRequestEntity;

          //all relationship code to follow per old integration syncContext.ts/addPRs
          const repo: BitbucketRepoEntity = <BitbucketRepoEntity>repoEntity;
          await jobState.addRelationship(
            createRepoHasPrRelationship(repo, prEntity),
          );

          const authorEntity = userByIdMap[convertedPR.authorId];
          if (authorEntity) {
            await jobState.addRelationship(
              createUserOpenedPrRelationship(authorEntity, prEntity),
            );
          }

          for (const approverId of convertedPR.approverIds) {
            const approverEntity = userByIdMap[approverId];
            if (approverEntity) {
              await jobState.addRelationship(
                createUserApprovedPrRelationship(approverEntity, prEntity),
              );
            }
          }

          for (const reviewerId of convertedPR.reviewerIds) {
            const reviewerEntity = userByIdMap[reviewerId];
            if (reviewerEntity) {
              await jobState.addRelationship(
                createUserReviewedPrRelationship(reviewerEntity, prEntity),
              );
            }
          }
        },
      );
    },
  );
}

export const prSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-prs',
    name: 'Fetch PRs',
    entities: [
      {
        resourceName: 'Bitbucket Pull Request',
        _type: BITBUCKET_PR_ENTITY_TYPE,
        _class: BITBUCKET_PR_ENTITY_CLASSES,
        partial: true, //do not delete PRs that are not fetched, because sometimes we might intentionally ingest a subset
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_REPO_PR_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_REPO_ENTITY_TYPE,
        targetType: BITBUCKET_PR_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: BITBUCKET_USER_OPENED_PR_RELATIONSHIP_TYPE,
        _class: RelationshipClass.OPENED,
        sourceType: BITBUCKET_USER_ENTITY_TYPE,
        targetType: BITBUCKET_PR_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: BITBUCKET_USER_APPROVED_PR_RELATIONSHIP_TYPE,
        _class: RelationshipClass.APPROVED,
        sourceType: BITBUCKET_USER_ENTITY_TYPE,
        targetType: BITBUCKET_PR_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: BITBUCKET_USER_REVIEWED_PR_RELATIONSHIP_TYPE,
        _class: RelationshipClass.REVIEWED,
        sourceType: BITBUCKET_USER_ENTITY_TYPE,
        targetType: BITBUCKET_PR_ENTITY_TYPE,
        partial: true,
      },
    ],
    dependsOn: ['fetch-repos', 'fetch-users'],
    executionHandler: fetchPRs,
  },
];
