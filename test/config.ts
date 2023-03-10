import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';
import { StepTestConfig } from '@jupiterone/integration-sdk-testing';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { invocationConfig } from '../src';
import { IntegrationConfig } from '../src/config';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationConfig: IntegrationConfig = {
  oauthKey: process.env.OAUTH_KEY || 'testingkey',
  oauthSecret: process.env.OAUTH_SECRET || 'testingsecret',
  //workspace in the config is an array, but the .env var can't be
  workspace: process.env.WORKSPACE
    ? process.env.WORKSPACE.split(',')
    : ['test-workspace-j1-integration'],
  ingestPullRequests: process.env.INGEST_PULL_REQUESTS !== 'false',
  enrichedPrs: process.env.ENRICHED_PRS === 'true' || false,
};

export function buildStepTestConfigForStep(stepId: string): StepTestConfig {
  return {
    stepId,
    instanceConfig: integrationConfig,
    invocationConfig: invocationConfig as IntegrationInvocationConfig,
  };
}
