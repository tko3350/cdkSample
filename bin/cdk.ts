#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { IamStack } from '../lib/iam-stack';
import { InflaStack } from '../lib/infla-stack';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();
const env  = { account: '734035609620', region: 'ap-northeast-1' };

const networkStack = new NetworkStack(app, 'networkStack', {
  env:env
});
const iamStack = new AppStack(app, 'iamStack', {
  env:env
});
const inflaStack = new AppStack(app, 'inflaStack', {
  env:env
});
const appStack = new AppStack(app, 'appStack', {
  env:env
});
//appStack.node.addDependency(networkStack);