import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps, Duration, RemovalPolicy, Aws, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface PrimaryKeyStackProps extends StackProps {
  keyAdminUserArns: string[];
  subRegion: string;
  backupRole: iam.IRole;
  pendingWindow?: Duration;
  removalPolicy?: RemovalPolicy;
}

export class PrimaryKeyStack extends Stack {
  public readonly key: kms.IKey;

  public static readonly KEY_ARN_OUTPUT_KEY = 'KeyArn';

  constructor(scope: Construct, id: string, props: PrimaryKeyStackProps) {
    super(scope, id, props);

    this.key = new kms.Key(this, 'Key', {
      enableKeyRotation: true,
      pendingWindow: props.pendingWindow,
      alias: 'alias/backup-key',
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: new iam.PolicyDocument({
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
                'aws:PrincipalArn': [
                  `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/cdk-*-cfn-exec-role-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
                  `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:role/cdk-*-cfn-exec-role-${Aws.ACCOUNT_ID}-${props.subRegion}`,
                ],
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.ArnPrincipal(props.backupRole.roleArn)],
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
            principals: [new iam.ArnPrincipal(props.backupRole.roleArn)],
            actions: ['kms:CreateGrant'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:GrantIsForAWSResource': true,
              },
            },
          }),
        ],
      }),
      removalPolicy: props.removalPolicy,
    });

    const cfnKey = this.key.node.defaultChild as kms.CfnKey;
    cfnKey.addPropertyOverride('MultiRegion', true);

    // クロスリージョン参照用
    new CfnOutput(this, PrimaryKeyStack.KEY_ARN_OUTPUT_KEY, { value: this.key.keyArn });
  }
}
