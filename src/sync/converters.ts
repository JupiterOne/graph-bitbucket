import {
  createIntegrationEntity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
  BITBUCKET_GROUP_ENTITY_CLASS,
  BITBUCKET_GROUP_ENTITY_TYPE,
  BITBUCKET_GROUP_USER_RELATIONSHIP_TYPE,
  BITBUCKET_PR_ENTITY_CLASSES,
  BITBUCKET_PR_ENTITY_TYPE,
  BITBUCKET_PROJECT_ENTITY_CLASS,
  BITBUCKET_PROJECT_ENTITY_TYPE,
  BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_REPO_ENTITY_CLASS,
  BITBUCKET_REPO_ENTITY_TYPE,
  BITBUCKET_REPO_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_APPROVED_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_ENTITY_CLASS,
  BITBUCKET_USER_ENTITY_TYPE,
  BITBUCKET_USER_GROUP_RELATIONSHIP_TYPE,
  BITBUCKET_USER_OPENED_PR_RELATIONSHIP_TYPE,
  BITBUCKET_USER_REVIEWED_PR_RELATIONSHIP_TYPE,
  BITBUCKET_WORKSPACE_ENTITY_CLASS,
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_WORKSPACE_GROUP_RELATIONSHIP_TYPE,
  BITBUCKET_WORKSPACE_PROJECT_RELATIONSHIP_TYPE,
  BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE,
  BITBUCKET_WORKSPACE_USER_RELATIONSHIP_TYPE,
} from '../constants';
import {
  BitbucketCommit,
  BitbucketGroup,
  BitbucketGroupEntity,
  BitbucketGroupUserRelationship,
  BitbucketPR,
  BitbucketProject,
  BitbucketProjectEntity,
  BitbucketProjectRepoRelationship,
  BitbucketPRState,
  BitbucketPullRequestEntity,
  BitbucketRepo,
  BitbucketRepoEntity,
  BitbucketRepoPullRequestRelationship,
  BitbucketUser,
  BitbucketUserEntity,
  BitbucketUserGroupRelationship,
  BitbucketUserPullRequestRelationship,
  BitbucketWorkspace,
  BitbucketWorkspaceEntity,
  BitbucketWorkspaceGroupRelationship,
  BitbucketWorkspaceProjectRelationship,
  BitbucketWorkspaceRepoRelationship,
  BitbucketWorkspaceUserRelationship,
  IdEntityMap,
} from '../types';
import { Approval } from './approval/parsePRActivity';
import {
  aggregateProperties,
  commitMessageSummary,
  displayNamesFromUUIDs,
  flattenMatrix,
} from './helpers';

export function createWorkspaceEntity(
  workspace: BitbucketWorkspace,
): BitbucketWorkspaceEntity {
  const workspaceEntity: BitbucketWorkspaceEntity = {
    _type: BITBUCKET_WORKSPACE_ENTITY_TYPE,
    _class: [BITBUCKET_WORKSPACE_ENTITY_CLASS],
    _key: workspace.uuid,
    slug: workspace.slug,
    name: workspace.name,
    displayName: workspace.name,
    webLink: workspace.links.html.href,
    isPrivate: workspace.is_private,
    createdOn: parseTimePropertyValue(workspace.created_on),
    updatedOn: parseTimePropertyValue(workspace.updated_on),
  };
  return workspaceEntity;
}

export function createUserEntity(user: BitbucketUser): BitbucketUserEntity {
  return createIntegrationEntity({
    entityData: {
      source: user,
      assign: {
        _type: BITBUCKET_USER_ENTITY_TYPE,
        _class: BITBUCKET_USER_ENTITY_CLASS,
        _key: user.uuid,
        nickname: user.nickname,
        displayName: user.display_name,
        name: user.display_name,
        username: user.display_name,
        active: true,
      },
    },
  }) as BitbucketUserEntity;
}

export function createGroupEntity(group: BitbucketGroup): BitbucketGroupEntity {
  const { members, ...source } = group; // remove members for raw data

  return createIntegrationEntity({
    entityData: {
      source,
      assign: {
        _type: BITBUCKET_GROUP_ENTITY_TYPE,
        _class: BITBUCKET_GROUP_ENTITY_CLASS,
        _key: `bitbucket-group:${group.slug}`, //there is no uuid in API v.1.0 objects
        displayName: group.name,
        name: group.name,
        permission: group.permission,
        autoAdd: group.auto_add,
        slug: group.slug,
      },
    },
  }) as BitbucketGroupEntity;
}

export function createRepoEntity(
  accountUUID: string,
  repo: BitbucketRepo,
): BitbucketRepoEntity {
  const repoEntity: BitbucketRepoEntity = {
    _type: BITBUCKET_REPO_ENTITY_TYPE,
    _class: BITBUCKET_REPO_ENTITY_CLASS,
    _key: repo.uuid,
    name: repo.name,
    fullName: repo.full_name.toLowerCase(),
    owner: repo.full_name.toLowerCase().split('/')[0],
    ownerId: accountUUID,
    displayName: repo.name,
    projectId: repo.project && repo.project.uuid,
    public: !repo.is_private,
    webLink: repo.links.html.href,
    createdOn: parseTimePropertyValue(repo.created_on),
    updatedOn: parseTimePropertyValue(repo.updated_on),
  };
  return repoEntity;
}

export function createProjectEntity(
  workspace: string,
  project: BitbucketProject,
): BitbucketProjectEntity {
  const projectEntity: BitbucketProjectEntity = {
    _type: BITBUCKET_PROJECT_ENTITY_TYPE,
    _class: BITBUCKET_PROJECT_ENTITY_CLASS,
    _key: project.uuid,
    key: project.key,
    name: project.name,
    description: project.description || '',
    public: !project.is_private,
    workspace: workspace,
    displayName: project.name,
    webLink: project.links.html.href,
    createdOn: parseTimePropertyValue(project.created_on),
    updatedOn: parseTimePropertyValue(project.updated_on),
  };
  return projectEntity;
}

export interface PRConverterInput {
  accountUUID: string;
  pullRequest: BitbucketPR;
  commits: BitbucketCommit[];
  commitsApproved: BitbucketCommit[];
  commitsByUnknownAuthor: BitbucketCommit[];
  approvedCommitsRemoved: boolean;
  approvals: Approval[];
  usersByUUID?: IdEntityMap<BitbucketUserEntity>;
}

export function createPrEntity({
  accountUUID,
  pullRequest,
  commits,
  commitsApproved,
  commitsByUnknownAuthor,
  approvedCommitsRemoved,
  approvals,
  usersByUUID,
}: PRConverterInput): BitbucketPullRequestEntity {
  const commitsHashes = commits.map((c) => c.hash);
  const commitsApprovedHashes = commitsApproved.map((c) => c.hash);
  const approverUUIDs = flattenMatrix<string>(
    aggregateProperties<string[]>('approverUUIDs', approvals),
  );

  const prEntity: BitbucketPullRequestEntity = {
    _type: BITBUCKET_PR_ENTITY_TYPE,
    _class: BITBUCKET_PR_ENTITY_CLASSES,
    _key: `${pullRequest.destination.repository.full_name}/pull-requests/${pullRequest.id}`,

    accountId: accountUUID,
    repoId: pullRequest.destination.repository.uuid,
    repository: pullRequest.destination.repository.name,
    id: pullRequest.id,
    name: pullRequest.title,
    displayName: `${pullRequest.destination.repository.name}/${pullRequest.id}`,
    title: pullRequest.title,
    description:
      pullRequest.description.length > 0
        ? `${pullRequest.description.substring(0, 80)}...`
        : undefined,
    webLink: pullRequest.links.html.href,

    taskCount: pullRequest.task_count,
    commentCount: pullRequest.comment_count,

    state: pullRequest.state,
    open: pullRequest.state === BitbucketPRState.Open,
    merged: pullRequest.state === BitbucketPRState.Merged,
    declined: pullRequest.state === BitbucketPRState.Declined,
    approved:
      commits.length > 0
        ? commits.reduce(
            (approved: boolean, commit) =>
              approved && commitsApproved.includes(commit),
            true,
          )
        : false,
    validated: commitsByUnknownAuthor.length === 0,
    approvedCommitsRemoved,

    commits: commitsHashes,
    commitMessages: commits.map((c) => commitMessageSummary(c.message)),
    commitsApproved: commitsApprovedHashes,
    commitsNotApproved: commitsHashes.filter(
      (c) => !commitsApprovedHashes.includes(c),
    ),
    commitsByUnknownAuthor: commitsByUnknownAuthor.map((c) => c.hash),

    source: pullRequest.source.branch.name,
    target: pullRequest.destination.branch.name,
    closeSourceBranch: pullRequest.close_source_branch,

    createdOn: parseTimePropertyValue(pullRequest.created_on),
    updatedOn: parseTimePropertyValue(pullRequest.updated_on),

    authorId: pullRequest.author.uuid,
    author: pullRequest.author.display_name,
    reviewerIds: aggregateProperties<string>('uuid', pullRequest.reviewers),
    reviewers: aggregateProperties<string>(
      'display_name',
      pullRequest.reviewers,
    ),
    approverIds: approverUUIDs,
    approvers: usersByUUID
      ? displayNamesFromUUIDs(approverUUIDs, usersByUUID)
      : [],
  };
  return prEntity;
}

export function createWorkspaceHasUserRelationship(
  workspace: BitbucketWorkspaceEntity,
  user: BitbucketUserEntity,
): BitbucketWorkspaceUserRelationship {
  return {
    _key: `${workspace._key}|has|${user._key}`,
    _class: 'HAS',
    _type: BITBUCKET_WORKSPACE_USER_RELATIONSHIP_TYPE,
    _fromEntityKey: workspace._key,
    _toEntityKey: user._key,
    displayName: 'HAS',
  };
}

export function createWorkspaceHasGroupRelationship(
  workspace: BitbucketWorkspaceEntity,
  group: BitbucketGroupEntity,
): BitbucketWorkspaceGroupRelationship {
  return {
    _key: `${workspace._key}|has|${group._key}`,
    _class: 'HAS',
    _type: BITBUCKET_WORKSPACE_GROUP_RELATIONSHIP_TYPE,
    _fromEntityKey: workspace._key,
    _toEntityKey: group._key,
    displayName: 'HAS',
  };
}

export function createWorkspaceOwnsRepoRelationship(
  workspace: BitbucketWorkspaceEntity,
  repo: BitbucketRepoEntity,
): BitbucketWorkspaceRepoRelationship {
  return {
    _key: `${workspace._key}|owns|${repo._key}`,
    _class: 'OWNS',
    _type: BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE,
    _fromEntityKey: workspace._key,
    _toEntityKey: repo._key,
    displayName: 'OWNS',
  };
}

export function createWorkspaceOwnsProjectRelationship(
  workspace: BitbucketWorkspaceEntity,
  project: BitbucketProjectEntity,
): BitbucketWorkspaceProjectRelationship {
  return {
    _key: `${workspace._key}|owns|${project._key}`,
    _class: 'OWNS',
    _type: BITBUCKET_WORKSPACE_PROJECT_RELATIONSHIP_TYPE,
    _fromEntityKey: workspace._key,
    _toEntityKey: project._key,
    displayName: 'OWNS',
  };
}

export function createProjectHasRepoRelationship(
  project: BitbucketProjectEntity,
  repo: BitbucketRepoEntity,
): BitbucketProjectRepoRelationship {
  return {
    _key: `${project._key}|has|${repo._key}`,
    _class: 'HAS',
    _type: BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE,
    _fromEntityKey: project._key,
    _toEntityKey: repo._key,
    displayName: 'HAS',
  };
}

export function createRepoHasPrRelationship(
  repo: BitbucketRepoEntity,
  pullrequest: BitbucketPullRequestEntity,
): BitbucketRepoPullRequestRelationship {
  return {
    _key: `${repo._key}|has|${pullrequest._key}`,
    _class: 'HAS',
    _type: BITBUCKET_REPO_PR_RELATIONSHIP_TYPE,
    _fromEntityKey: repo._key,
    _toEntityKey: pullrequest._key,
    displayName: 'HAS',
  };
}

export function createGroupHasUserRelationship(
  group: BitbucketGroupEntity,
  user: BitbucketUserEntity,
): BitbucketGroupUserRelationship {
  return {
    _key: `${group._key}|has|${user._key}`,
    _class: 'HAS',
    _type: BITBUCKET_GROUP_USER_RELATIONSHIP_TYPE,
    _fromEntityKey: group._key,
    _toEntityKey: user._key,
    displayName: 'HAS',
  };
}

export function createUserOwnsGroupRelationship(
  user: BitbucketUserEntity,
  group: BitbucketGroupEntity,
): BitbucketUserGroupRelationship {
  return {
    _key: `${user._key}|owns|${group._key}`,
    _class: 'OWNS',
    _type: BITBUCKET_USER_GROUP_RELATIONSHIP_TYPE,
    _fromEntityKey: user._key,
    _toEntityKey: group._key,
    displayName: 'OWNS',
  };
}

export function createUserOpenedPrRelationship(
  user: BitbucketUserEntity,
  pullrequest: BitbucketPullRequestEntity,
): BitbucketUserPullRequestRelationship {
  return {
    _key: `${user._key}|opened|${pullrequest._key}`,
    _class: 'OPENED',
    _type: BITBUCKET_USER_OPENED_PR_RELATIONSHIP_TYPE,
    _fromEntityKey: user._key,
    _toEntityKey: pullrequest._key,
    displayName: 'OPENED',
  };
}

export function createUserReviewedPrRelationship(
  user: BitbucketUserEntity,
  pullrequest: BitbucketPullRequestEntity,
): BitbucketUserPullRequestRelationship {
  return {
    _key: `${user._key}|reviewed|${pullrequest._key}`,
    _class: 'REVIEWED',
    _type: BITBUCKET_USER_REVIEWED_PR_RELATIONSHIP_TYPE,
    _fromEntityKey: user._key,
    _toEntityKey: pullrequest._key,
    displayName: 'REVIEWED',
  };
}

export function createUserApprovedPrRelationship(
  user: BitbucketUserEntity,
  pullrequest: BitbucketPullRequestEntity,
): BitbucketUserPullRequestRelationship {
  return {
    _key: `${user._key}|approved|${pullrequest._key}`,
    _class: 'APPROVED',
    _type: BITBUCKET_USER_APPROVED_PR_RELATIONSHIP_TYPE,
    _fromEntityKey: user._key,
    _toEntityKey: pullrequest._key,
    displayName: 'APPROVED',
  };
}
