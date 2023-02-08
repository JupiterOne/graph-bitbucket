import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const repoSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-repos',
    name: 'Fetch Repos',
    entities: [
      {
        resourceName: 'Bitbucket Repo',
        _type: 'bitbucket_repo',
        _class: ['CodeRepo'],
      },
    ],
    relationships: [
      {
        _type: 'bitbucket_workspace_owns_repo',
        sourceType: 'bitbucket_workspace',
        _class: RelationshipClass.OWNS,
        targetType: 'bitbucket_repo',
      },
      {
        _type: 'bitbucket_project_has_repo',
        sourceType: 'bitbucket_project',
        _class: RelationshipClass.HAS,
        targetType: 'bitbucket_repo',
      },
    ],
    dependsOn: ['fetch-projects'],
    implemented: true,
  },
];
