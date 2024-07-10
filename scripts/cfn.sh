#!/bin/bash
set -e
export $(grep -v '^#' .env | xargs)

usage() {
  printf "\nUsage: $0 \n"
  printf "This script requires the AWS CLI with an active profile configured!\n"
  printf "The \$MONGO_URL environment variable must be set!\n"
  exit 1
}
[[ -z "$MONGO_URL" ]] && usage

updateTemplates() {
  mkdir -p dist/lambda
  aws s3 sync .cloudformation s3://cf-templates-most-popular-content/templates

  echo "Building lambda functions"
  ./scripts/build-lambdas.js

  ZIP_HASH=$(md5 -q dist/lambda.zip)

  echo "Uploading lambda functions"
  aws s3 cp dist/lambda.zip s3://cf-templates-most-popular-content/lambda/most-popular-content.$ZIP_HASH.zip
}

updateStack() {
  echo "Updating most-popular-content CloudFormation stack..."
  aws cloudformation update-stack \
    --stack-name most-popular-content \
    --region us-east-2 \
    --parameters ParameterKey=MongoURL,ParameterValue=$MONGO_URL \
                 ParameterKey=ZipHash,ParameterValue=$ZIP_HASH \
    --template-url https://s3.us-east-2.amazonaws.com/cf-templates-most-popular-content/templates/stack.yaml \
    --capabilities CAPABILITY_NAMED_IAM
  echo "Waiting for the stack to be updated, this may take a few minutes..."
  echo "See the progress at: https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks"
  aws cloudformation wait stack-update-complete \
    --stack-name most-popular-content \
    --region us-east-2
}

updateTemplates
updateStack
