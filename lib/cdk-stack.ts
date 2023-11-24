import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export default class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const dlq = new sqs.Queue(this, 'CdkDlq', {
      visibilityTimeout: cdk.Duration.seconds(300),
      enforceSSL: true,
    });

    new sqs.Queue(this, 'CdkQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      enforceSSL: true,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });
  }
}
