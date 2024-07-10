# Most Popular Website Content

## API Deployment

The API project is built and deployed to K8S via Github Actions

## Lambda Deployment

This project has been imported to a [AWS Cloudformation](https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks/stackinfo?stackId=arn%3Aaws%3Acloudformation%3Aus-east-2%3A598984531759%3Astack%2Fmost-popular-content%2Ffd7e5790-3ed0-11ef-a333-021e135c1eab) stack, and changes _must_ be made via the
[scripts/cfn.sh](.scripts/cfn.sh) script. You must have valid AWS access keys with
permission to modify the Lambda function.

```sh
./scripts/cfn.sh
```
