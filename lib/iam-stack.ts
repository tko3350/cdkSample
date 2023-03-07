import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const adminUsers = [
      'admin_01',
      'admin_02',
      'admin_03'
    ];
    // group
    const admingroup = new iam.Group(this, 'AdminGroup',{groupName:'AdminGroup'});
    admingroup.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"));
    // user
    const signinPassword = "hogehoge";
    adminUsers.forEach(admin => {
      new iam.User(this, admin, {
        userName:admin,
        groups:[admingroup],
        password: cdk.SecretValue.plainText(signinPassword),
        passwordResetRequired: true,
      })
    });
  }
}