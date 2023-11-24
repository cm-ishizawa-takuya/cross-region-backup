import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps, Duration, RemovalPolicy, Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RemoteOutputs } from 'cdk-remote-stack';

import { BackupRoleStack } from './backup-role-stack';
import { PrimaryKeyStack } from './primary-key-stack';

export interface ReplicaKeyStackProps extends StackProps {
  keyAdminUserArns: string[];
  backupRoleStack: BackupRoleStack;
  primaryKeyStack: PrimaryKeyStack;
  pendingWindow?: Duration;
  removalPolicy?: RemovalPolicy;
}

export class ReplicaKeyStack extends Stack {
  public readonly key: kms.CfnReplicaKey;

  constructor(scope: Construct, id: string, props: ReplicaKeyStackProps) {
    super(scope, id, props);

    const backupRoleStackOutputs = new RemoteOutputs(this, 'BackupRoleStackOutputs', {
      stack: props.backupRoleStack,
    });
    const backupRoleArn = backupRoleStackOutputs.get(BackupRoleStack.BACKUP_ROLE_ARN_OUTPUT_KEY);

    const primaryKeyStackOutputs = new RemoteOutputs(this, 'PrimaryKeyStackOutputs', {
      stack: props.primaryKeyStack,
    });
    const primaryKeyArn = primaryKeyStackOutputs.get(PrimaryKeyStack.KEY_ARN_OUTPUT_KEY);

    this.key = new kms.CfnReplicaKey(this, 'Key', {
      pendingWindowInDays: props.pendingWindow?.toDays(),
      primaryKeyArn,
      keyPolicy: JSON.stringify(
        new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: props.keyAdminUserArns.map((arn) => new iam.ArnPrincipal(arn)),
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
              conditions: {
                ArnLike: {
                  'aws:PrincipalArn': `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/cdk-*-cfn-exec-role-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.ArnPrincipal(backupRoleArn)],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.ArnPrincipal(backupRoleArn)],
              actions: ['kms:CreateGrant'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'kms:GrantIsForAWSResource': true,
                },
              },
            }),
          ],
        }).toJSON(),
      ),
    });
    this.key.applyRemovalPolicy(props.removalPolicy);
  }
}
