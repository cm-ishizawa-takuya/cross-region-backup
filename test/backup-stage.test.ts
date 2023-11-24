import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BackupStage } from '../lib/stage/backup-stage';

test('Snapshot test', () => {
  const app = new cdk.App();
  const stage = new BackupStage(app, 'BackupStage', {
    keyAdminUserArns: [
      'arn:aws:iam::123456789012:user/test-user1',
      'arn:aws:iam::123456789012:user/test-user2',
    ],
    mainRegion: 'ap-northeast-1',
    subRegion: 'ap-northeast-3',
    cronExpression: 'cron(0 * * * ? *)',
    backupTagKey: 'Backup',
    backupTagValue: 'True',
  });
  stage.node.children.forEach((child) => {
    if (child instanceof cdk.Stack) {
      expect(Template.fromStack(child).toJSON()).toMatchSnapshot();
    }
  });
});
