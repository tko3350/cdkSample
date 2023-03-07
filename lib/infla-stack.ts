import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';


export class InflaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpc = ssm.StringParameter.FromLookup(this, 'vpc');
    const prisub1a = ssm.StringParameter.valueForStringParameter(this, 'prisub1a');
    const prisub1c = ssm.StringParameter.valueForStringParameter(this, 'prisub1c');

    // ******************************************************************************
    //                                    EC2                                
    // ******************************************************************************
    // ******************* Security Group for ec2 **********************************
    const sgec2 = new ec2.SecurityGroup(this,'sgec2',{
      vpc:vpc,
      allowAllOutbound:true,
    });
    sgec2.addIngressRule(ec2.Peer.ipv4('10.10.10.0/24'),ec2.Port.tcp(22))
    // ******************* key pair **********************************
    const key = new ec2.CfnKeyPair(this,'keypair',{
      keyName: 'ec2-key',
    });
    // ******************* ec2 **********************************
    const image = new ec2.AmazonLinuxImage()
    new ec2.Instance(this,'prd-ec2-personalEvaluation-DBConsole',{
    vpc:vpc,
    availabilityZone:'ap-northeast-1a',
    vpcSubnets:{subnets:pubsub1a_s.subnets},
    securityGroup:sgec2,
    keyName:cdk.Token.asString(key.ref),
    instanceType:ec2.InstanceType.of(ec2.InstanceClass.T2,ec2.InstanceSize.MICRO),
    machineImage:image,
    instanceName:'prd-ec2-personalEvaluation-DBConsole'
    });

    // ******************************************************************************
    //                                 RDS
    // ******************************************************************************
    const subnetGroup = new rds.CfnDBSubnetGroup(this, 'SubnetGroupRds', {
      dbSubnetGroupDescription: 'Subnet Group for RDS',
      subnetIds: [prisub1a.subnetId,prisub1c.subnetId],
      dbSubnetGroupName: 'SubnetGroupRds',
    });
    const engine = rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_31});
    const db = new rds.DatabaseInstance(this,"prd-rds-personalEvaluation",{
      engine: engine,
      allocatedStorage:20,
      maxAllocatedStorage:22,
      vpc:vpc,
      vpcSubnets:{subnets:prisub1a_s.subnets},
      availabilityZone:'ap-northeast-1a',
      subnetGroup:rds.SubnetGroup.fromSubnetGroupName(this, id, 'SubnetGroupRds'),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3,ec2.InstanceSize.MICRO),
      multiAz:false,
      autoMinorVersionUpgrade:true,
      preferredMaintenanceWindow:'sun:15:00-sun:15:30',
      //enablePerformanceInsights:true,
      instanceIdentifier:'dbserver',
      databaseName:'dbserver',
      //timezone: 'JST',
      credentials: rds.Credentials.fromPassword('MySQLadmin',cdk.SecretValue.ssmSecure('/dbPassword', '1')),
    });
    db.connections.allowDefaultPortFrom(sgec2);
    // ******************* s3 **********************************
    const bucket = new s3.Bucket(this,'takaosugimototest20220225',{
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName:'takaosugimototest20220225',
      versioned:true,  
      lifecycleRules:[
          {
            id:'lifecycle-test',
            expiration:cdk.Duration.days(1),
            noncurrentVersionExpiration: cdk.Duration.days(2),
          }
      ]
    });
/*
        // ******************* ok CloudTrail **********************************
        const trail = new ctrail.Trail(this,'sugimototesttrail',{
          s3KeyPrefix:'cloudtrail-logs-test',
          isMultiRegionTrail:true,
          trailName:'testtrail'
        });
        // ******************* ok WAFv2 **********************************
        const websiteWafV2WebAcl = new wafv2.CfnWebACL(this, "WafV2WebAcl", {
          defaultAction: { allow: {} },
          scope: "REGIONAL",
          name: 'waftest',
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "websiteWafV2WebAcl",
          },
          rules: [
            {
              name: "AWSManagedRulesCommonRuleSet",
              priority: 1,
              statement: {
                managedRuleGroupStatement: {
                  vendorName: "AWS",
                  name: "AWSManagedRulesCommonRuleSet",
                },
              },
              overrideAction: { none: {} },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: "AWSManagedRulesCommonRuleSet",
              },
            },
            {
              name: "AWSManagedRulesAdminProtectionRuleSet",
              priority: 2,
              statement: {
                managedRuleGroupStatement: {
                  vendorName: "AWS",
                  name: "AWSManagedRulesAdminProtectionRuleSet",
                },
              },
              overrideAction: { none: {} },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: "AWSManagedRulesAdminProtectionRuleSet",
              },
            },
            {
              name: "AWSManagedRulesKnownBadInputsRuleSet",
              priority: 3,
              statement: {
                managedRuleGroupStatement: {
                  vendorName: "AWS",
                  name: "AWSManagedRulesKnownBadInputsRuleSet",
                },
              },
              overrideAction: { none: {} },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: "AWSManagedRulesKnownBadInputsRuleSet",
              },
            },
            {
              name: "AWSManagedRulesAmazonIpReputationList",
              priority: 4,
              statement: {
                managedRuleGroupStatement: {
                  vendorName: "AWS",
                  name: "AWSManagedRulesAmazonIpReputationList",
                },
              },
              overrideAction: { none: {} },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: "AWSManagedRulesAmazonIpReputationList",
              },
            },
            {
              name: "AWSManagedRulesAnonymousIpList",
              priority: 5,
              statement: {
                managedRuleGroupStatement: {
                  vendorName: "AWS",
                  name: "AWSManagedRulesAnonymousIpList",
                },
              },
              overrideAction: { none: {} },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: "AWSManagedRulesAnonymousIpList",
              },
            },
          ],
        });
        // WAF to cognito
        const wafAssoc = new wafv2.CfnWebACLAssociation(this, 'tnc-waf-assoc', {
          resourceArn: UserPool.userPoolArn,
          webAclArn: websiteWafV2WebAcl.attrArn
        });
*/    
  }
}


