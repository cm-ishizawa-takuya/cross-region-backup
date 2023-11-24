import * as backup from 'aws-cdk-lib/aws-backup';
import { Stack, StackProps, Aws, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RemoteOutputs } from 'cdk-remote-stack';

import { SubRegionBackupStack } from './sub-region-backup-stack';

export interface MainRegionBackupStackProps extends StackProps {
  subRegionBackupStack: SubRegionBackupStack;
  keyArn: string;
  backupRoleArn: string;
  backupVaultName?: string;
  cronExpression: string;
  backupTagKey: string;
  backupTagValue: string;
  deleteAfterDays?: number;
  removalPolicy?: RemovalPolicy;
}

export class MainRegionBackupStack extends Stack {
  vault: backup.CfnBackupVault;

  constructor(scope: Construct, id: string, props: MainRegionBackupStackProps) {
    super(scope, id, props);

    const subRegionBackupStackOutputs = new RemoteOutputs(this, 'SubRegionBackupStackOutputs', {
      stack: props.subRegionBackupStack,
    });
    const subRegionBackupVaultArn = subRegionBackupStackOutputs.get(
      SubRegionBackupStack.BACKUP_VAULT_ARN_OUTPUT_KEY,
    );

    const vaultName = props.backupVaultName ?? `backup-vault-${Aws.REGION}`;
    const deleteAfterDays = props.deleteAfterDays ?? 7;

    this.vault = new backup.CfnBackupVault(this, 'Vault', {
      backupVaultName: vaultName,
      encryptionKeyArn: props.keyArn,
    });
    this.vault.applyRemovalPolicy(props.removalPolicy);

    const plan = new backup.CfnBackupPlan(this, 'Plan', {
      backupPlan: {
        backupPlanName: 'cross-region-backup-plan',
        backupPlanRule: [
          {
            ruleName: 'cross-region-backup-plan-rule',
            targetBackupVault: this.vault.ref,
            scheduleExpression: props.cronExpression,
            startWindowMinutes: 60,
            completionWindowMinutes: 180,
            lifecycle: {
              deleteAfterDays,
            },
            copyActions: [
              {
                destinationBackupVaultArn: subRegionBackupVaultArn,
              },
            ],
          },
        ],
      },
    });

    new backup.CfnBackupSelection(this, 'Selection', {
      backupPlanId: plan.ref,
      backupSelection: {
        selectionName: 'cross-region-backup-selection',
        iamRoleArn: props.backupRoleArn,
        resources: ['arn:aws:ec2:*:*:instance/*'],
        listOfTags: [
          {
            conditionType: 'STRINGEQUALS',
            conditionKey: props.backupTagKey,
            conditionValue: props.backupTagValue,
          },
        ],
        conditions: {
          StringEquals: [
            {
              ConditionKey: `aws:ResourceTag/${props.backupTagKey}`,
              ConditionValue: props.backupTagValue,
            },
          ],
        },
      },
    });
  }
}
