#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

import CdkStack from '../lib/cdk-stack';

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks());
new CdkStack(app, 'CdkStack', {});
