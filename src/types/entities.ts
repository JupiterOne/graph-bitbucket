import { Entity } from '@jupiterone/integration-sdk-core';

export interface BitbucketUserEntity extends Entity {
  _type: 'bitbucket_user';
  nickname: string;
  name?: string;
  webLink?: string;
}

export interface BitbucketGroupEntity extends Entity {
  _type: 'bitbucket_group';
  name: string;
  permission: string;
  autoAdd: boolean;
  slug: string;
  //the object from the API has members: and owner: properties also
  //which we'll represent by relationships
}

export interface BitbucketWorkspaceEntity extends Entity {
  _type: 'bitbucket_workspace';
  slug: string;
  webLink?: string;
}

export interface BitbucketPermissionEntity extends Entity {
  _type: 'bitbucket_permission';
  permission: string;
  principalKey: string;
  ownerId: string;
  name: string;
}

export interface BitbucketRepoEntity extends Entity {
  _type: 'bitbucket_repo';
  name: string;
  fullName: string;
  public: boolean;
  owner: string;
  ownerId: string;
  projectId: string | undefined;
  webLink?: string;
  createdOn: number | undefined;
  updatedOn: number | undefined;
}

export interface BitbucketProjectEntity extends Entity {
  _type: 'bitbucket_project';
  workspace: string;
  name: string;
  key: string;
  description?: string;
  public: boolean;
  webLink?: string;
  createdOn: number | undefined;
  updatedOn: number | undefined;
}

export interface BitbucketPullRequestEntity extends Entity {
  _type: 'bitbucket_pullrequest';
  accountId: string;
  repoId: string;
  repository: string;
  id: string;

  name: string;
  title: string;
  description?: string;
  webLink?: string;

  taskCount: number;
  commentCount: number;

  state: string;
  open: boolean;
  merged: boolean;
  declined: boolean;
  approved: boolean;
  validated: boolean;
  approvedCommitsRemoved: boolean;

  commits: string[];
  commitMessages: string[];
  commitsApproved: string[];
  commitsNotApproved: string[];
  commitsByUnknownAuthor: string[];

  source: string;
  target: string;
  closeSourceBranch: boolean;

  createdOn: number | undefined;
  updatedOn: number | undefined;

  authorId: string;
  author: string;
  reviewerIds: string[];
  reviewers: string[];
  approverIds: string[];
  approvers: string[];
}

export interface IdEntityMap<V> {
  [key: string]: V;
}
