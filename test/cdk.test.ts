import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import CdkStack from '../lib/cdk-stack';

test('Snapshot test', () => {
  const app = new cdk.App();
  const stack = new CdkStack(app, 'TestStack');
  expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
});
