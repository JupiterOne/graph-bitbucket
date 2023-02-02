import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { IntegrationConfig } from '../config';
import { fetchUsers } from './users';
import { fetchWorkspaces } from './workspaces';
import { setupBitbucketRecording } from '../../test/recording';
import { integrationConfig } from '../../test/config';
import { fetchProjects } from './projects';
import { fetchRepos } from './repos';
import { fetchGroups } from './groups';

let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test('should collect data', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'steps', //redaction of headers is in setupBitbucketRecording
  });

  const context = createMockStepExecutionContext<IntegrationConfig>({
    instanceConfig: integrationConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchWorkspaces(context);
  await fetchUsers(context);
  await fetchGroups(context);
  await fetchProjects(context);
  await fetchRepos(context);

  //note: detailed converter tests exist in sync/converters.test.ts
  //this includes details of converting fetched PRs, which are only
  //fetched within the last 24 hours
  //because that is well tested there, these tests are only checking
  //on fetching the other objects

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_workspace' },
        slug: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_user' },
        displayName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['displayName'],
    },
  });

  const groups = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('UserGroup'),
  );
  expect(groups.length).toBeGreaterThan(0);
  expect(groups).toMatchGraphObjectSchema({
    _class: ['UserGroup'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_group' },
        displayName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['displayName'],
    },
  });

  const projects = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Project'),
  );
  expect(projects.length).toBeGreaterThan(0);
  expect(projects).toMatchGraphObjectSchema({
    _class: ['Project'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_project' },
        name: { type: 'string' },
        workspace: { type: 'string' },
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'workspace', 'webLink'],
    },
  });

  const repos = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('CodeRepo'),
  );
  expect(repos.length).toBeGreaterThan(0);
  expect(repos).toMatchGraphObjectSchema({
    _class: ['CodeRepo'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_repo' },
        name: { type: 'string' },
        ownerId: { type: 'string' },
        projectId: { type: 'string' },
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'ownerId', 'projectId', 'webLink'],
    },
  });
});
