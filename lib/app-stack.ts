import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';


export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpc = ssm.StringParameter.valueFromLookup(this, 'vpc');
    const prisub1a = ssm.StringParameter.valueForStringParameter(this, 'prisub1a');
    const prisub1c = ssm.StringParameter.valueForStringParameter(this, 'prisub1c');

    // ******************************************************************************
    //                             Lambda                                            
    // ******************************************************************************
    interface Lambdafunc {
      func1: string;
      func2: string;
      func3: string;
      func4: string;
      [key: string]: string;
    }
    const lambdafunc : Lambdafunc= {
      func1: 'func01',
      func2: 'func02',
      func3: 'func03',
      func4: 'func04',
      func5: 'func05',
    };
    
    const vpc1 = ec2.Vpc.fromLookup(this,"vpc1",{vpcId:vpc});
    const lambdasubnets = [
      ec2.Subnet.fromSubnetId(this,"vprisub1a",prisub1a),
      ec2.Subnet.fromSubnetId(this,"vprisub1c",prisub1c),
    ]
    for (const key of Object.keys(lambdafunc)) {
      const lambdaf = new lambda.Function(this,key,{
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'lambda_function.lambda_handler',
        functionName: lambdafunc[key],
        vpc:vpc1,
        vpcSubnets:{subnets:lambdasubnets},     
      //securityGroups: [lambdasg],
      });
    }
    // ******************************************************************************
    //                             API Gateway                                            
    // ******************************************************************************
    const restApi = new api.RestApi(this,"restapi01",{
      restApiName: 'restapi01',
      endpointTypes:[
        api.EndpointType.REGIONAL
      ],
      deployOptions:{
        stageName: 'teststage',
        metricsEnabled:true,
        loggingLevel:api.MethodLoggingLevel.ERROR,
        dataTraceEnabled:false,
      },
    });
    const level1 = restApi.root.addResource("level1");
    level1.addMethod("OPTIONS",new api.MockIntegration({
      integrationResponses: [
        { statusCode: '200' },
      ],
      passthroughBehavior: api.PassthroughBehavior.WHEN_NO_MATCH,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }),
      {
      methodResponses:[
        {
          statusCode: '200',
          responseModels: {
            'application/json': api.Model.EMPTY_MODEL
          }
        }
      ]
    });
    // ******************* API Gateway(answer) **********************************
    const answer = level1.addResource("answer")
    const api_func1 = lambda.Function.fromFunctionName(this,"api_func1",lambdafunc.func1)
    answer.addMethod("GET",new api.LambdaIntegration(api_func1,{
      proxy:true,
      integrationResponses: [
        { statusCode: '200' },
      ],
    }),
    {
      methodResponses:[
        {
          statusCode: '200',
          responseModels: {
            'application/json': api.Model.EMPTY_MODEL
          }
        }
      ]
    });
    answer.addMethod("OPTIONS",new api.MockIntegration({
      integrationResponses: [
        { statusCode: '200' },
      ],
      passthroughBehavior: api.PassthroughBehavior.WHEN_NO_MATCH,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }),
      {
      methodResponses:[
        {
          statusCode: '200',
          responseModels: {
            'application/json': api.Model.EMPTY_MODEL
          }
        }
      ]
    });
    const api_func2 = lambda.Function.fromFunctionName(this,"api_func2",lambdafunc.func2)
    answer.addMethod("POST",new api.LambdaIntegration(api_func2,{
      proxy:true,
      integrationResponses: [
        { statusCode: '200' },
      ],
    }),
    {
      methodResponses:[
        {
          statusCode: '200',
          responseModels: {
            'application/json': api.Model.EMPTY_MODEL
          }
        }
      ]
    });

  }
}
