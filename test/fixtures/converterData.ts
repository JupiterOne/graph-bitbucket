import { parseTimePropertyValue } from '@jupiterone/integration-sdk-core';
import { v4 as uuid } from 'uuid';
import { BitbucketPR, BitbucketWorkspace } from '../../src/types';

export const workspaceApiResponse = ({
  uuid: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
  links: {
    owners: {
      href:
        'https://bitbucket.org/!api/2.0/workspaces/lifeomic/members?q=permission%3D%22owner%22',
    },
    self: { href: 'https://bitbucket.org/!api/2.0/workspaces/lifeomic' },
    repositories: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic',
    },
    snippets: { href: 'https://bitbucket.org/!api/2.0/snippets/lifeomic' },
    html: { href: 'https://bitbucket.org/lifeomic/' },
    avatar: {
      href: 'https://bitbucket.org/workspaces/lifeomic/avatar/?ts=1596575986',
    },
    members: {
      href: 'https://bitbucket.org/!api/2.0/workspaces/lifeomic/members',
    },
    projects: {
      href: 'https://bitbucket.org/!api/2.0/workspaces/lifeomic/projects',
    },
  },
  created_on: '2020-07-01T13:27:21.119256+00:00',
  type: 'workspace',
  slug: 'lifeomic',
  is_private: true,
  name: 'LifeOmic',
} as unknown) as BitbucketWorkspace;

export const expectedWorkspaceEntity = {
  _type: 'bitbucket_workspace',
  _class: ['Account'],
  _key: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
  slug: 'lifeomic',
  name: 'LifeOmic',
  displayName: 'LifeOmic',
  isPrivate: true,
  createdOn: 1593610041119,
  updatedOn: undefined,
  webLink: 'https://bitbucket.org/lifeomic/',
};

export const userUUID = '{109cd504-f55e-48a0-8e7a-d04f0b10f016}';
const userAccountKey = '557058:b2338264-19cc-4730-94c4-abb7bf1a66dc';
export const userApiResponse = {
  nickname: 'philgatesidem-lifeomic',
  website: null,
  display_name: 'Phil Gates-Idem',
  account_key: userAccountKey,
  links: {
    hooks: {
      href: `https://bitbucket.org/!api/2.0/users/${userAccountKey}/hooks`,
    },
    self: {
      href: `https://bitbucket.org/!api/2.0/users/${userUUID}`,
    },
    repositories: {
      href: `https://bitbucket.org/!api/2.0/repositories/${userUUID}`,
    },
    avatar: {
      href: `https://bitbucket.org/account/${userUUID}/avatar/32/`,
    },
    snippets: {
      href: `https://bitbucket.org/!api/2.0/snippets/${userUUID}`,
    },
  },
  created_on: '2017-01-06T01:32:04.527738+00:00',
  is_staff: false,
  location: null,
  type: 'user',
  uuid: userUUID,
};

export const repoApiResponse = {
  scm: 'git',
  website: '',
  has_wiki: true,
  name: 'wiki',
  links: {
    watchers: {
      href:
        'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/watchers',
    },
    branches: {
      href:
        'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/refs/branches',
    },
    tags: {
      href:
        'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/refs/tags',
    },
    commits: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/commits',
    },
    clone: [
      {
        href: 'https://philgatesidem-lifeomic@bitbucket.org/lifeomic/wiki.git',
        name: 'https',
      },
      {
        href: 'git@bitbucket.org:lifeomic/wiki.git',
        name: 'ssh',
      },
    ],
    self: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki',
    },
    source: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/src',
    },
    html: {
      href: 'https://bitbucket.org/lifeomic/wiki',
    },
    avatar: {
      href: 'https://bitbucket.org/lifeomic/wiki/avatar/32/',
    },
    hooks: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/hooks',
    },
    forks: {
      href: 'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/forks',
    },
    downloads: {
      href:
        'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/downloads',
    },
    pullrequests: {
      href:
        'https://bitbucket.org/!api/2.0/repositories/lifeomic/wiki/pullrequests',
    },
  },
  fork_policy: 'no_public_forks',
  uuid: '{f964169d-b646-45f3-84e4-075b0ba0ddcd}',
  project: {
    key: 'INFRA',
    type: 'project',
    uuid: '{6029bf2f-b210-482b-8b20-1e34da13d4bf}',
    links: {
      self: {
        href: 'https://bitbucket.org/!api/2.0/teams/lifeomic/projects/INFRA',
      },
      html: {
        href: 'https://bitbucket.org/account/user/lifeomic/projects/INFRA',
      },
      avatar: {
        href:
          'https://bitbucket.org/account/user/lifeomic/projects/INFRA/avatar/32',
      },
    },
    name: 'infra',
  },
  language: '',
  created_on: '2017-01-07T15:31:07.438237+00:00',
  mainbranch: {
    type: 'branch',
    name: 'master',
  },
  full_name: 'lifeomic/wiki',
  has_issues: false,
  owner: {
    nickname: 'lifeomic',
    display_name: 'LifeOmic',
    type: 'team',
    uuid: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    links: {
      self: {
        href: 'https://bitbucket.org/!api/2.0/teams/lifeomic',
      },
      html: {
        href: 'https://bitbucket.org/lifeomic/',
      },
      avatar: {
        href: 'https://bitbucket.org/account/lifeomic/avatar/32/',
      },
    },
  },
  updated_on: '2018-03-16T15:06:30.100221+00:00',
  size: 15547342,
  type: 'repository',
  slug: 'wiki',
  is_private: true,
  description: '',
};

export const expectedRepoEntity = {
  _type: 'bitbucket_repo',
  _class: 'CodeRepo',
  _key: '{f964169d-b646-45f3-84e4-075b0ba0ddcd}',
  name: 'wiki',
  fullName: 'lifeomic/wiki',
  public: false,
  owner: 'lifeomic',
  ownerId: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
  displayName: 'wiki',
  projectId: '{6029bf2f-b210-482b-8b20-1e34da13d4bf}',
  createdOn: 1483803067438,
  updatedOn: 1521212790100,
  webLink: 'https://bitbucket.org/lifeomic/wiki',
};

const dateVal = new Date().toISOString();
export const projectApiResponse = {
  uuid: uuid(),
  key: '🔑',
  name: 'omae wa mo shinderu',
  description: 'nothing personal kid',
  is_private: true,
  created_on: dateVal,
  updated_on: dateVal,
  links: {
    self: {
      href: 'https://jupiterone.io/self',
    },
    html: {
      href: 'https://jupiterone.io/html',
    },
    avatar: {
      href: 'https://jupiterone.io/avatar',
    },
  },
};

export function expectedProjectEntity(workspace: string) {
  return {
    _type: 'bitbucket_project',
    _class: 'Project',
    _key: projectApiResponse.uuid,
    key: '🔑',
    name: 'omae wa mo shinderu',
    description: 'nothing personal kid',
    public: false,
    workspace: workspace,
    displayName: 'omae wa mo shinderu',
    webLink: 'https://jupiterone.io/html',
    createdOn: parseTimePropertyValue(projectApiResponse.created_on),
    updatedOn: parseTimePropertyValue(projectApiResponse.updated_on),
  };
}

export const prApiResponse = ({
  description:
    'This is an automated pull request created by `@lifeomic/deploy-tools`.',
  links: {
    decline: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/decline',
    },
    commits: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/commits',
    },
    self: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149',
    },
    comments: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/comments',
    },
    merge: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/merge',
    },
    html: {
      href:
        'https://bitbucket.org/lifeomic/jupiter-web-policies/pull-requests/149',
    },
    activity: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/activity',
    },
    diff: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/diff',
    },
    approve: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/approve',
    },
    statuses: {
      href:
        'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/pullrequests/149/statuses',
    },
  },
  title:
    '🚀 Deploy Tools invites you to upgrade @lifeomic/jupiter-web-toolkit@^5.35.2',
  close_source_branch: false,
  type: 'pullrequest',
  id: '149',
  destination: {
    commit: {
      hash: '621458778a28',
      type: 'commit',
      links: {
        self: {
          href:
            'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/commit/621458778a28',
        },
        html: {
          href:
            'https://bitbucket.org/lifeomic/jupiter-web-policies/commits/621458778a28',
        },
      },
    },
    repository: {
      links: {
        self: {
          href:
            'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies',
        },
        html: {
          href: 'https://bitbucket.org/lifeomic/jupiter-web-policies',
        },
        avatar: {
          href:
            'https://bytebucket.org/ravatar/%7B32186636-9145-4322-b92e-bf6c6e91b9a5%7D?ts=js',
        },
      },
      type: 'repository',
      name: 'jupiter-web-policies',
      full_name: 'lifeomic/jupiter-web-policies',
      uuid: '{32186636-9145-4322-b92e-bf6c6e91b9a5}',
    },
    branch: {
      name: 'master',
    },
  },
  created_on: '2019-01-09T22:29:52.288542+00:00',
  summary: {
    raw:
      'This is an automated pull request created by `@lifeomic/deploy-tools`.',
    markup: 'markdown',
    html:
      '<p>This is an automated pull request created by <code>@lifeomic/deploy-tools</code>.</p>',
    type: 'rendered',
  },
  source: {
    commit: {
      hash: 'b4503f8ddbfa',
      type: 'commit',
      links: {
        self: {
          href:
            'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies/commit/b4503f8ddbfa',
        },
        html: {
          href:
            'https://bitbucket.org/lifeomic/jupiter-web-policies/commits/b4503f8ddbfa',
        },
      },
    },
    repository: {
      links: {
        self: {
          href:
            'https://api.bitbucket.org/2.0/repositories/lifeomic/jupiter-web-policies',
        },
        html: {
          href: 'https://bitbucket.org/lifeomic/jupiter-web-policies',
        },
        avatar: {
          href:
            'https://bytebucket.org/ravatar/%7B32186636-9145-4322-b92e-bf6c6e91b9a5%7D?ts=js',
        },
      },
      type: 'repository',
      name: 'jupiter-web-policies',
      full_name: 'lifeomic/jupiter-web-policies',
      uuid: '{32186636-9145-4322-b92e-bf6c6e91b9a5}',
    },
    branch: {
      name: 'deploy-tools/upgrade-@lifeomic/jupiter-web-toolkit@5.35.2',
    },
  },
  comment_count: 0,
  state: 'OPEN',
  task_count: 0,
  reason: '',
  updated_on: '2019-01-09T23:20:36.906690+00:00',
  author: {
    username: 'lifeomic',
    display_name: 'LifeOmic',
    type: 'team',
    uuid: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    links: {
      self: {
        href: 'https://api.bitbucket.org/2.0/teams/lifeomic',
      },
      html: {
        href: 'https://bitbucket.org/lifeomic/',
      },
      avatar: {
        href: 'https://bitbucket.org/account/lifeomic/avatar/',
      },
    },
  },
  reviewers: [
    {
      username: 'erkangz',
      display_name: 'Erkang Zheng',
      uuid: '{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}',
      links: {
        self: {
          href:
            'https://bitbucket.org/!api/2.0/users/%7B14d17a6c-f0fd-4d1d-a8d2-b143354a2995%7D',
        },
        html: {
          href:
            'https://bitbucket.org/%7B14d17a6c-f0fd-4d1d-a8d2-b143354a2995%7D/',
        },
        avatar: {
          href:
            'https://avatar-cdn.atlassian.com/557058%3Ac1f2ea6e-5675-456e-a9ec-b37a43aaeeb5?by=id&sg=A1jiSpTkEY7VLWT8DPOqUDSY1ac%3D&d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FEZ-6.png',
        },
      },
      nickname: 'Erkang Zheng',
      type: 'user',
      account_id: '557058:c1f2ea6e-5675-456e-a9ec-b37a43aaeeb5',
    },
    {
      username: 'aiwilliams-lo',
      display_name: 'Adam Williams',
      uuid: '{11fcd85a-7350-4c81-8ad9-9a413a83600c}',
      links: {
        self: {
          href:
            'https://bitbucket.org/!api/2.0/users/%7B11fcd85a-7350-4c81-8ad9-9a413a83600c%7D',
        },
        html: {
          href:
            'https://bitbucket.org/%7B11fcd85a-7350-4c81-8ad9-9a413a83600c%7D/',
        },
        avatar: {
          href:
            'https://avatar-cdn.atlassian.com/5b3277b663379b3ac420d8a7?by=id&sg=sz6c6fs7E7ATSHnBf1U1I4vcIEA%3D&d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAW-4.svg',
        },
      },
      nickname: 'Adam Williams',
      type: 'user',
      account_id: '5b3277b663379b3ac420d8a7',
    },
  ],
  merge_commit: null,
  closed_by: null,
} as unknown) as BitbucketPR;

export const asdf123Commit: any = {
  hash: 'asdf123',
  author: {
    user: {
      display_name: 'A User',
      nickname: 'A User',
      uuid: 'a_user',
    },
    raw: 'hotdog',
  },
  message: 'asdf123 message',
};

export const hjkl456Commit: any = {
  hash: 'hjkl456',
  author: {
    user: {
      display_name: 'A User',
      nickname: 'A User',
      uuid: 'a_user',
    },
    raw: 'hotdog',
  },
  message: 'hjkl456 message',
};

export const qwer789Commit: any = {
  hash: 'qwer789',
  author: {
    user: {
      display_name: 'A User',
      nickname: 'A User',
      uuid: 'a_user',
    },
    raw: 'hotdog',
  },
  message: 'qwer789 message',
};

export const expectedPullRequestEntity = {
  _type: 'bitbucket_pullrequest',
  _class: ['Review', 'PR'],
  _key: 'lifeomic/jupiter-web-policies/pull-requests/149',
  name:
    '🚀 Deploy Tools invites you to upgrade @lifeomic/jupiter-web-toolkit@^5.35.2',
  displayName: `jupiter-web-policies/149`,
  id: prApiResponse.id,
  accountId: 'le_account',
  authorId: prApiResponse.author.uuid,
  author: prApiResponse.author.display_name,
  reviewerIds: [
    '{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}',
    '{11fcd85a-7350-4c81-8ad9-9a413a83600c}',
  ],
  reviewers: ['Erkang Zheng', 'Adam Williams'],
  approverIds: ['{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}'],
  approvers: ['Erkang Zheng'],
  title: prApiResponse.title,
  description: `${prApiResponse.description.substring(0, 80)}...`,
  state: prApiResponse.state,
  source: prApiResponse.source.branch.name,
  target: prApiResponse.destination.branch.name,
  closeSourceBranch: prApiResponse.close_source_branch,
  repository: prApiResponse.destination.repository.name,
  repoId: prApiResponse.destination.repository.uuid,
  createdOn: new Date(prApiResponse.created_on!).getTime(),
  updatedOn: new Date(prApiResponse.updated_on!).getTime(),
  taskCount: prApiResponse.task_count,
  commentCount: prApiResponse.comment_count,
  webLink: prApiResponse.links.html.href,
  commits: ['asdf123', 'hjkl456', 'qwer789'],
  commitMessages: ['asdf123 message', 'hjkl456 message', 'qwer789 message'],
  commitsApproved: ['asdf123', 'hjkl456'],
  commitsNotApproved: ['qwer789'],
  commitsByUnknownAuthor: ['hjkl456'],
  approvedCommitsRemoved: false,
  approved: false,
  validated: false,
  open: true,
  merged: false,
  declined: false,
};
