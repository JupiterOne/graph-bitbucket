import { IntegrationSpecConfig } from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../../../src/config';
import { groupSpec } from './groups';
import { projectSpec } from './project';
import { prsSpec } from './pullrequests';
import { repoSpec } from './repos';
import { userSpec } from './user';
import { workspaceSpec } from './workspaces';

export const invocationConfig: IntegrationSpecConfig<IntegrationConfig> = {
  integrationSteps: [
    ...userSpec,
    ...workspaceSpec,
    ...groupSpec,
    ...projectSpec,
    ...prsSpec,
    ...repoSpec,
  ],
};
