import { v4 as uuid } from 'uuid';

import {
  asdf123Commit,
  expectedProjectEntity,
  expectedPullRequestEntity,
  expectedRepoEntity,
  expectedWorkspaceEntity,
  hjkl456Commit,
  prApiResponse,
  projectApiResponse,
  qwer789Commit,
  repoApiResponse,
  userApiResponse,
  workspaceApiResponse,
} from '../../test/fixtures/converterData';
import { BitbucketRepo, BitbucketUser } from '../types';
import {
  BitbucketRepoEntity,
  BitbucketUserEntity,
  BitbucketWorkspaceEntity,
} from '../types/entities';
import * as converters from './converters';

test('convertWorkspaceToEntity', () => {
  const entity = converters.createWorkspaceEntity(workspaceApiResponse);
  expect(entity).toEqual(expectedWorkspaceEntity);
});

test('convertUserToEntity', () => {
  const entity = converters.createUserEntity(userApiResponse as BitbucketUser);
  expect(entity).toEqual({
    _type: 'bitbucket_user',
    _class: ['User'],
    _key: '{109cd504-f55e-48a0-8e7a-d04f0b10f016}',
    _rawData: [
      {
        name: 'default',
        rawData: userApiResponse,
      },
    ],
    nickname: 'philgatesidem-lifeomic',
    displayName: 'Phil Gates-Idem',
    name: 'Phil Gates-Idem',
    username: 'Phil Gates-Idem',
    active: true,
  });
});

test('convertRepoToEntity', () => {
  const entity = converters.createRepoEntity(
    '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    repoApiResponse as BitbucketRepo,
  );
  expect(entity).toEqual(expectedRepoEntity);
});

test('convertProjectToEntity', () => {
  const workspace = 'lifeomic';
  const entity = converters.createProjectEntity(workspace, projectApiResponse);
  expect(entity).toEqual(expectedProjectEntity(workspace));
});

describe('convertPRToEntity', () => {
  test('calculates approval values', () => {
    const entity = converters.createPrEntity({
      accountUUID: 'le_account',
      pullRequest: prApiResponse,
      commits: [asdf123Commit, hjkl456Commit, qwer789Commit],
      commitsApproved: [asdf123Commit, hjkl456Commit],
      commitsByUnknownAuthor: [hjkl456Commit],
      approvedCommitsRemoved: false,
      approvals: [
        { approverUUIDs: ['{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}'] } as any,
      ],
      usersByUUID: {
        '{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}': {
          name: 'Erkang Zheng',
        } as any,
      },
    });

    expect(entity).toEqual(expectedPullRequestEntity);
  });

  test('sets approved to false if there are no commits', () => {
    const entity = converters.createPrEntity({
      accountUUID: 'le_account',
      pullRequest: prApiResponse,
      commits: [],
      commitsApproved: [],
      commitsByUnknownAuthor: [],
      approvedCommitsRemoved: false,
      approvals: [],
    });

    expect(entity).toEqual({
      ...expectedPullRequestEntity,
      commits: [],
      commitMessages: [],
      commitsApproved: [],
      commitsNotApproved: [],
      commitsByUnknownAuthor: [],
      approverIds: [],
      approvers: [],
      validated: true,
    });
  });
});

test('convertWorkspaceUserToRelationship', () => {
  const workspace: BitbucketWorkspaceEntity = {
    _type: 'bitbucket_workspace',
    _class: ['Account'],
    _key: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    slug: 'lifeomic',
    displayName: 'lifeomic',
  };

  const user: BitbucketUserEntity = {
    _type: 'bitbucket_user',
    _class: 'User',
    _key: '{109cd504-f55e-48a0-8e7a-d04f0b10f016}',
    nickname: 'philgatesidem-lifeomic',
    displayName: 'philgatesidem-lifeomic',
  };

  const relationship = converters.createWorkspaceHasUserRelationship(
    workspace,
    user,
  );

  expect(relationship).toEqual({
    _key: `${workspace._key}|has|${user._key}`,
    _class: 'HAS',
    _type: 'bitbucket_workspace_has_user',
    _fromEntityKey: workspace._key,
    _toEntityKey: user._key,
    displayName: 'HAS',
  });
});

test('convertWorkspaceRepoToRelationship', () => {
  const workspaceEntity: BitbucketWorkspaceEntity = {
    _type: 'bitbucket_workspace',
    _class: 'Account',
    _key: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    slug: 'lifeomic',
  };

  const repo: BitbucketRepoEntity = {
    _type: 'bitbucket_repo',
    _class: 'CodeRepo',
    _key: '{f964169d-b646-45f3-84e4-075b0ba0ddcd}',
    name: 'wiki',
    fullName: 'lifeomic/wiki',
    public: false,
    owner: 'lifeomic',
    ownerId: uuid(),
    projectId: 'xyz',
    createdOn: 0,
    updatedOn: 0,
  };

  const relationship = converters.createWorkspaceOwnsRepoRelationship(
    workspaceEntity,
    repo,
  );

  expect(relationship).toEqual({
    _key: `${workspaceEntity._key}|owns|${repo._key}`,
    _class: 'OWNS',
    _type: 'bitbucket_workspace_owns_repo',
    _fromEntityKey: workspaceEntity._key,
    _toEntityKey: repo._key,
    displayName: 'OWNS',
  });
});
