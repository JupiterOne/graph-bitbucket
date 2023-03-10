import {
  executeStepWithDependencies,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { setupBitbucketRecording } from '../../test/recording';
import { buildStepTestConfigForStep } from '../../test/config';

let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test('fetch-users', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'fetch-users', //redaction of headers is in setupBitbucketRecording
  });

  const stepConfig = buildStepTestConfigForStep('fetch-users');
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
}, 500000);

test('fetch-workspaces', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'fetch-workspaces', //redaction of headers is in setupBitbucketRecording
  });

  const stepConfig = buildStepTestConfigForStep('fetch-workspaces');
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
}, 500000);

test('fetch-projects', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'fetch-projects', //redaction of headers is in setupBitbucketRecording
  });

  const stepConfig = buildStepTestConfigForStep('fetch-projects');
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
}, 500000);

test('fetch-repos', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'fetch-repos', //redaction of headers is in setupBitbucketRecording
  });

  const stepConfig = buildStepTestConfigForStep('fetch-repos');
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
}, 500000);
