import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';

export interface BackupRoleStackProps extends StackProps {
  backupRoleName?: string;
}

export class BackupRoleStack extends Stack {
  public readonly backupRole: iam.IRole;

  public static readonly BACKUP_ROLE_ARN_OUTPUT_KEY = 'BackupRoleArn';

  constructor(scope: Construct, id: string, props: BackupRoleStackProps) {
    super(scope, id, props);

    const roleName = props.backupRoleName ?? 'cross-region-backup-role';

    this.backupRole = new iam.Role(this, 'BackupRole', {
      roleName,
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForBackup',
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForRestores',
        ),
      ],
      inlinePolicies: {
        'iam-pass-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // クロスリージョン参照用
    new CfnOutput(this, BackupRoleStack.BACKUP_ROLE_ARN_OUTPUT_KEY, {
      value: this.backupRole.roleArn,
    });
  }
}
