import { Stage, StageProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BackupRoleStack } from '../stack/backup-role-stack';
import { PrimaryKeyStack } from '../stack/primary-key-stack';
import { ReplicaKeyStack } from '../stack/replica-key-stack';
import { SubRegionBackupStack } from '../stack/sub-region-backup-stack';
import { MainRegionBackupStack } from '../stack/main-region-backup-stack';

export interface BackupStageProps extends StageProps {
  keyAdminUserArns: string[];
  mainRegion: string;
  subRegion: string;
  backupRoleName?: string;
  primaryKeyPendingWindow?: Duration;
  replicaKeyPendingWindow?: Duration;
  mainRegionBackupVaultName?: string;
  subRegionBackupVaultName?: string;
  cronExpression: string;
  backupTagKey: string;
  backupTagValue: string;
  removalPolicy?: RemovalPolicy;
}

export class BackupStage extends Stage {
  constructor(scope: Construct, id: string, props: BackupStageProps) {
    super(scope, id, props);

    const backupRoleStack = new BackupRoleStack(this, 'BackupRoleStack', {
      backupRoleName: props.backupRoleName,
      env: {
        region: props.mainRegion,
      },
    });

    const primaryKeyStack = new PrimaryKeyStack(this, 'PrimaryKeyStack', {
      keyAdminUserArns: props.keyAdminUserArns,
      subRegion: props.subRegion,
      backupRole: backupRoleStack.backupRole,
      pendingWindow: props.primaryKeyPendingWindow,
      removalPolicy: props.removalPolicy,
      env: {
        region: props.mainRegion,
      },
    });

    const replicaKeyStack = new ReplicaKeyStack(this, 'ReplicaKeyStack', {
      keyAdminUserArns: props.keyAdminUserArns,
      backupRoleStack,
      primaryKeyStack,
      pendingWindow: props.replicaKeyPendingWindow,
      removalPolicy: props.removalPolicy,
      env: {
        region: props.subRegion,
      },
    });
    replicaKeyStack.addDependency(backupRoleStack);
    replicaKeyStack.addDependency(primaryKeyStack);

    const subRegionBackupStack = new SubRegionBackupStack(this, 'SubRegionBackupStack', {
      keyArn: replicaKeyStack.key.attrArn,
      backupVaultName: props.subRegionBackupVaultName,
      removalPolicy: props.removalPolicy,
      env: {
        region: props.subRegion,
      },
    });

    const mainRegionBackupStack = new MainRegionBackupStack(this, 'MainRegionBackupStack', {
      subRegionBackupStack,
      keyArn: primaryKeyStack.key.keyArn,
      backupRoleArn: backupRoleStack.backupRole.roleArn,
      backupVaultName: props.mainRegionBackupVaultName,
      cronExpression: props.cronExpression,
      backupTagKey: props.backupTagKey,
      backupTagValue: props.backupTagValue,
      removalPolicy: props.removalPolicy,
      env: {
        region: props.mainRegion,
      },
    });
    mainRegionBackupStack.addDependency(subRegionBackupStack);
  }
}
