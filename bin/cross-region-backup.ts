#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects, Duration } from 'aws-cdk-lib';

import { BackupStage } from '../lib/stage/backup-stage';

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks());
new BackupStage(app, 'BackupStage', {
  keyAdminUserArns: ['arn:aws:iam::123456789012:user/test-user'],
  mainRegion: 'ap-northeast-1',
  subRegion: 'ap-northeast-3',
  primaryKeyPendingWindow: Duration.days(7),
  replicaKeyPendingWindow: Duration.days(7),
  mainRegionBackupVaultName: 'MainRegionBackupVault',
  subRegionBackupVaultName: 'SubRegionBackupVault',
  cronExpression: 'cron(0 0 * * ? *)',
  backupTagKey: 'Backup',
  backupTagValue: 'True',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
