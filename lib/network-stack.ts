import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let VPC_CIDR = '10.1.0.0/16'
    let PUBLIC_SUBNET_1a_CIDR  = "10.1.10.0/24"
    let PUBLIC_SUBNET_1c_CIDR  = "10.1.11.0/24"
    let PRIVATE_SUBNET_1a_CIDR = "10.1.20.0/24"
    let PRIVATE_SUBNET_1c_CIDR = "10.1.21.0/24"

    const vpc = new ec2.Vpc(this, "vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      vpcName: "vpc",
      subnetConfiguration: [], 
    });

    const publicSubnet1a = new ec2.PublicSubnet(this, "publicSubnet1a", {
      vpcId: vpc.vpcId,
      availabilityZone: "ap-northeast-1a",
      cidrBlock: "10.0.1.0/24",
      mapPublicIpOnLaunch:true,
    });
    const publicSubnet1c = new ec2.PublicSubnet(this, "publicSubnet1c", {
      vpcId: vpc.vpcId,
      availabilityZone: "ap-northeast-1c",
      cidrBlock: "10.0.2.0/24",
      mapPublicIpOnLaunch:true,
    });
    const privateSubnet1a = new ec2.PrivateSubnet(this, "privateSubnet1a", {
      vpcId: vpc.vpcId,
      availabilityZone: "ap-northeast-1a",
      cidrBlock: "10.0.3.0/24",
    });
    const privateSubnet1c = new ec2.PrivateSubnet(this, "privateSubnet1c", {
      vpcId: vpc.vpcId,
      availabilityZone: "ap-northeast-1c",
      cidrBlock: "10.0.4.0/24",
    });
    new ssm.StringParameter(this, 'ssmvpc', {
      parameterName: 'vpc',
      stringValue: vpc.vpcId,
    });
    new ssm.StringParameter(this, 'pubsub1a', {
      parameterName: 'pubsub1a',
      stringValue: publicSubnet1a.subnetId,
    });
    new ssm.StringParameter(this, 'pubsub1c', {
      parameterName: 'pubsub1c',
      stringValue: publicSubnet1c.subnetId,
    });
    new ssm.StringParameter(this, 'prisub1a', {
      parameterName: 'prisub1a',
      stringValue: privateSubnet1a.subnetId,
    });
    new ssm.StringParameter(this, 'prisub1c', {
      parameterName: 'prisub1c',
      stringValue: privateSubnet1c.subnetId,
    });
    // ******************* Internet Gateway *****************************************
    const igw1 = new ec2.CfnInternetGateway(this, 'InternetGateway', {
      tags: [{ key: 'Name', value: 'igw2' }]
    });
    const igw2 = new ec2.CfnVPCGatewayAttachment(this, 'VpcGatewayAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: igw1.ref,
    });
    publicSubnet1a.addRoute("pubsubroute",{
      routerType: ec2.RouterType.GATEWAY,
      routerId:igw1.ref
    });
    publicSubnet1c.addRoute("pubsubroute",{
      routerType: ec2.RouterType.GATEWAY,
      routerId:igw1.ref
    });
    // ******************* S3 Gateway *****************************************
    // create route table for private-1a,private-1c
    const cfn_rtpri1a = new ec2.CfnRouteTable(this, 'cfn_rtpri1a',{
      vpcId:vpc.vpcId,
        tags:[{
          key:'Name',
          value:'cfn_rtpri1a',
        }]
    });
    //  associatioin route table for private1a
    const cfn_association1a = new ec2.CfnSubnetRouteTableAssociation(this, 'cfn_association1a',{
      routeTableId:cfn_rtpri1a.ref,
        subnetId:publicSubnet1a.subnetId,
    });
    //  associatioin route table for private1c
    const cfn_association1c = new ec2.CfnSubnetRouteTableAssociation(this, 'cfn_association1c',{
      routeTableId:cfn_rtpri1a.ref,
        subnetId:publicSubnet1c.subnetId,
    });

    // create s3 gateway
    const cfnVPCEndpoint = new ec2.CfnVPCEndpoint(this, 'MyCfnVPCEndpoint', {
      serviceName: 'com.amazonaws.ap-northeast-1.s3',
      vpcId:vpc.vpcId,
      vpcEndpointType: 'Gateway',
      routeTableIds:[cfn_rtpri1a.ref]
    });    

  }
}
