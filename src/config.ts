import {
  IntegrationExecutionContext,
  IntegrationValidationError,
  IntegrationInstanceConfigFieldMap,
  IntegrationInstanceConfig,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from './client';
import { BitbucketIntegrationConfig } from './types/integration';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 */

export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  bitbucketOauthKey: {
    type: 'string',
  },
  bitbucketOauthSecret: {
    type: 'string',
    mask: true,
  },
  bitbucketWorkspace: {
    type: 'string',
  },
};

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  /**
   * The BitBucket Oauth key used to authenticate requests.
   */
  bitbucketOauthKey: string;

  /**
   * The BitBucket Oauth secret used to authenticate requests.
   */
  bitbucketOauthSecret: string;

  /**
   * The name of the BitBucket workspace.
   */
  bitbucketWorkspace: string | string[];

  /**
   * Whether Pull Request ingestion is desired.
   * Optional. Defaults to true. Set to 'false' if PRs are not desired
   */
  bitbucketIngestPullRequests?: string;
}

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const apiClient = createAPIClient(context.instance.config, context);
  await apiClient.verifyAuthentication();
}

// TODO: Remove this code and only use config values without the "Bitbucket" prefix
export function getExpandedConfig(config): BitbucketIntegrationConfig {
  const expandedConfig: BitbucketIntegrationConfig = {
    oauthKey: config.bitbucketOauthKey,
    oauthSecret: config.bitbucketOauthSecret,
    teams: [config.bitbucketWorkspace],
    ...config,
    ingestPullRequests: config.bitbucketIngestPullRequests !== 'false',
  };
  if (
    !expandedConfig.oauthKey ||
    !expandedConfig.oauthSecret ||
    !expandedConfig.teams
  ) {
    throw new IntegrationValidationError(
      'Config requires all of {bitbucketOauthKey, bitbucketOauthSecret, bitbucketWorkspace}',
    );
  }
  return expandedConfig;
}
