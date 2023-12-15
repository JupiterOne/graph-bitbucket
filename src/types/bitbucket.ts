export type BitbucketWorkspaceMembership = {
  links: BitbucketLinks;
  user: BitbucketUser;
};

// https://developer.atlassian.com/bitbucket/api/2/reference/resource/user
export interface BitbucketUser {
  uuid: string;
  nickname: string;
  display_name: string;
}

// https://support.atlassian.com/bitbucket-cloud/docs/groups-endpoint/
// the /groups endpoint is from API v.1.0, which is generally deprecated,
// but this endpoint is still supported for some time because the 2.0 API doesn't
// support it
export interface BitbucketGroup {
  uuid: string;
  name: string;
  permission: string;
  auto_add: boolean;
  members: BitbucketUser[];
  owner: BitbucketUser;
  slug: string;
}

/**
 * @deprecated teams are no longer supported by Bitbucket but they still come
 * back in some response data.
 */
export interface BitbucketTeam {
  uuid: string;
  username: string;
  display_name: string;
  type: 'team';
  links: BitbucketLinks;
}

// https://developer.atlassian.com/bitbucket/api/2/reference/resource/workspaces/%7Bworkspace%7D
export interface BitbucketWorkspace {
  uuid: string;
  name: string;
  slug: string;
  is_private: boolean;
  type: string;
  links: BitbucketLinks;
  created_on: string; // date-time
  updated_on?: string; // date-time
}

// https://developer.atlassian.com/bitbucket/api/2/reference/resource/workspaces/%7Bworkspace%7D/projects/%7Bproject_key%7D
export interface BitbucketProject {
  uuid: string;
  key: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  links: BitbucketLinks;
}

export interface BitbucketProjectRef {
  uuid: string;
  key: string;
  name: string;
}

// https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D
export interface BitbucketRepo {
  uuid: string;
  name: string;
  full_name: string;
  is_private?: boolean;
  project?: BitbucketProjectRef;
  links: BitbucketLinks;
  owner?: BitbucketTeam | BitbucketUser;
  created_on: string;
  updated_on: string;
}

export interface BitbucketCommit {
  hash: BitbucketCommitHash;
  author: BitbucketCommitAuthor;
  parents: BitbucketCommitParent[];
  message: string;
}

export interface BitbucketCommitAuthor {
  raw: string;
  user: BitbucketUser;
}

export type BitbucketCommitHash = string;

export interface BitbucketCommitParent {
  hash: string;
  type: string;
}

export interface BitbucketPRActivity {
  approval?: BitbucketPRApproval;
  update?: BitbucketPRUpdate;
}

export interface BitbucketPRApproval {
  pullrequest: BitbucketPR;
  user: BitbucketUser;
}

export enum BitbucketPRState {
  Merged = 'MERGED',
  Superseded = 'SUPERSEDED',
  Open = 'OPEN',
  Declined = 'DECLINED',
}

export interface BitbucketPRUpdate {
  source: BitbucketPRSourceDestination;
  destination: BitbucketPRSourceDestination;
  state: BitbucketPRState;
}

// https://developer.atlassian.com/bitbucket/api/2/reference/resource/pullrequests/%7Bselected_user%7D
export interface BitbucketPR {
  id: string;
  author: BitbucketUser | BitbucketTeam; // Author can be a team in automated pull requests
  title: string;
  description: string;
  type: 'pullrequest';
  state: BitbucketPRState;
  source: BitbucketPRSourceDestination;
  destination: BitbucketPRSourceDestination;
  close_source_branch: boolean;
  closed_by?: BitbucketUser | null;
  reason: string;
  links: BitbucketPRLinks;
  reviewers?: BitbucketUser[]; //API gives this only if you pull the PR individually
  participants?: BitbucketUser[]; //API gives this only if you pull the PR individually
  created_on?: string;
  updated_on?: string;
  task_count: number;
  comment_count: number;
  merge_commit?: any | null;
}

export interface BitbucketLinks {
  self: {
    href: string;
  };
  html: {
    href: string;
  };
  avatar?: {
    href: string;
  };
}

export interface BitbucketPRLinks {
  decline: {
    href: string;
  };
  commits: {
    href: string;
  };
  self: {
    href: string;
  };
  comments: {
    href: string;
  };
  merge: {
    href: string;
  };
  html: {
    href: string;
  };
  activity: {
    href: string;
  };
  diff: {
    href: string;
  };
  approve: {
    href: string;
  };
  statuses: {
    href: string;
  };
}

export interface BitbucketPRSourceDestination {
  branch: {
    name: string;
  };
  commit: {
    hash: string;
    type: 'commit';
    links: BitbucketLinks;
  };
  repository: BitbucketRepo;
}

export interface BitbucketGroupPermission {
  type: string;
  group: BitbucketGroupPermissionGroup;
  permission: string;
  links: BitbucketGroupPermissionLinks;
}

export interface BitbucketGroupPermissionGroup {
  type: string;
  name: string;
  slug: string;
}

export interface BitbucketGroupPermissionLinks {
  self: BitbucketGroupPermissionSelf;
}

export interface BitbucketGroupPermissionSelf {
  href: string;
}

export interface BitbucketUserPermission {
  type: string;
  user: BitbucketUserPermissionUser;
  permission: string;
  links: BitbucketUserPermissionLinks;
}

export interface BitbucketUserPermissionLinks {
  self: BitbucketUserPermissionSelf;
}

export interface BitbucketUserPermissionSelf {
  href: string;
}

export interface BitbucketUserPermissionUser {
  type: string;
  display_name: string;
  uuid: string;
  account_id: string;
}

export interface BitbucketBranchRestriction {
  id: number;
  kind: string;
  value: string;
  branch_match_kind: string;
  type: string;
  users: BitbucketBranchRestrictionUser[];
  pattern: string;
  groups: BitbucketBranchRestrictionGroup[];
}

export interface BitbucketBranchRestrictionGroup {
  type: string;
  slug: string;
  full_slug: string;
  name: string;
}

export interface BitbucketBranchRestrictionUser {
  display_name: string;
  type: string;
  uuid: string;
  account_id: string;
  nickname: string;
}
