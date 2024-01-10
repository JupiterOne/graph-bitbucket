import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';
import { integrationSteps } from './steps';
import {
  IntegrationConfig,
  ingestionConfig,
  instanceConfigFields,
  validateInvocation,
} from './config';
import getStepStartStates from './getStepStartStates';

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> =
  {
    instanceConfigFields,
    getStepStartStates,
    integrationSteps,
    ingestionConfig,
    validateInvocation,
  };
