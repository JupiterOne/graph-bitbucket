import {
  createMockExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { integrationConfig } from '../../test/config';
import { setupBitbucketRecording } from '../../test/recording';
import BitbucketClient from './BitbucketClient';

const { logger } = createMockExecutionContext();

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('getWorkspace', () => {
  test('not found', async () => {
    recording = setupBitbucketRecording({
      directory: __dirname,
      name: 'getWorkspaceNotFound',
      options: {
        recordFailedRequests: true,
      },
    });

    const client = new BitbucketClient(logger, integrationConfig);
    await expect(client.getWorkspace('jupiteron1')).rejects.toThrow(
      /not found, please verify/,
    );
  });

  test('found', async () => {
    recording = setupBitbucketRecording({
      directory: __dirname,
      name: 'getWorkspace',
    });

    const client = new BitbucketClient(logger, integrationConfig);
    await expect(client.getWorkspace('jupiterone')).resolves.toMatchObject({
      created_on: '2020-07-01T13:27:21.119256+00:00',
      is_private: true,
      links: {
        avatar: {
          href: 'https://bitbucket.org/workspaces/jupiterone/avatar/?ts=1596575986',
        },
        html: {
          href: 'https://bitbucket.org/jupiterone/',
        },
        members: {
          href: 'https://bitbucket.org/!api/2.0/workspaces/jupiterone/members',
        },
        owners: {
          href: 'https://bitbucket.org/!api/2.0/workspaces/jupiterone/members?q=permission%3D%22owner%22',
        },
        projects: {
          href: 'https://bitbucket.org/!api/2.0/workspaces/jupiterone/projects',
        },
        repositories: {
          href: 'https://bitbucket.org/!api/2.0/repositories/jupiterone',
        },
        self: {
          href: 'https://bitbucket.org/!api/2.0/workspaces/jupiterone',
        },
        snippets: {
          href: 'https://bitbucket.org/!api/2.0/snippets/jupiterone',
        },
      },
      name: 'JupiterOne',
      slug: 'jupiterone',
      type: 'workspace',
      uuid: '{47ee2a27-c8fa-43c4-95fd-8384e557690e}',
    });
  });
});

describe('getAllWorkspaceMembers', () => {
  test('found', async () => {
    recording = setupBitbucketRecording({
      directory: __dirname,
      name: 'getWorkspaceMembers',
    });

    const client = new BitbucketClient(logger, integrationConfig);
    await expect(
      client.getAllWorkspaceMembers('jupiterone'),
    ).resolves.toContainEqual(
      expect.objectContaining({
        account_id: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        uuid: expect.any(String),
      }),
    );
  }, 30000);
});

describe('getAllProjects', () => {
  test('found', async () => {
    recording = setupBitbucketRecording({
      directory: __dirname,
      name: 'getAllProjects',
    });

    const client = new BitbucketClient(logger, integrationConfig);
    await expect(client.getAllProjects('jupiterone')).resolves.toContainEqual(
      expect.objectContaining({
        uuid: expect.any(String),
        key: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        is_private: expect.any(Boolean),
        created_on: expect.any(String),
        updated_on: expect.any(String),
        links: expect.any(Object),
      }),
    );
  }, 30000);
});

describe('getAllRepos', () => {
  test('found', async () => {
    recording = setupBitbucketRecording({
      directory: __dirname,
      name: 'getAllRepos',
    });

    const client = new BitbucketClient(logger, integrationConfig);
    await expect(client.getAllRepos('jupiterone')).resolves.toContainEqual(
      expect.objectContaining({
        uuid: expect.any(String),
        name: expect.any(String),
        full_name: expect.any(String),
        is_private: expect.any(Boolean),
        project: expect.objectContaining({
          links: expect.any(Object),
          key: expect.any(String),
          name: expect.any(String),
          uuid: expect.any(String),
        }),
        links: expect.any(Object),
        owner: expect.objectContaining({
          type: expect.any(String),
          links: expect.any(Object),
          display_name: expect.any(String),
          uuid: expect.any(String),
        }),
        created_on: expect.any(String),
        updated_on: expect.any(String),
      }),
    );
  }, 30000);
});
