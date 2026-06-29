#!/bin/bash

# Deployment script for dingziwei.com Lambda backend
# This script creates all AWS resources needed for the website

set -e

echo "==================================="
echo "dingziwei.com Lambda Deployment"
echo "==================================="

# Configuration
REGION="ap-east-1"
FUNCTION_NAME_UPLOAD="uploadFunc"
API_NAME="dingziwei-api"
S3_BUCKET="dingziwei-app-bucket"
STAGE="prod"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create IAM Role
echo -e "\n${BLUE}Step 1: Creating IAM execution role...${NC}"

ROLE_NAME="dingziwei-lambda-role"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Create role
if ! aws iam get-role --role-name $ROLE_NAME --region $REGION 2>/dev/null; then
    echo "Creating new IAM role: $ROLE_NAME"
    ROLE_ARN=$(aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document "$TRUST_POLICY" \
        --query 'Role.Arn' \
        --output text)
    echo -e "${GREEN}✓ Role created: $ROLE_ARN${NC}"
    sleep 2
else
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    echo -e "${GREEN}✓ Role exists: $ROLE_ARN${NC}"
fi

# Create and attach S3 policy
echo "Attaching S3 permissions to role..."
POLICY_DOCUMENT='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::dingziwei-app-bucket",
        "arn:aws:s3:::dingziwei-app-bucket/*"
      ]
    }
  ]
}'

POLICY_NAME="dingziwei-s3-policy"
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name $POLICY_NAME \
    --policy-document "$POLICY_DOCUMENT" 2>/dev/null || echo "Policy already attached"

echo -e "${GREEN}✓ S3 permissions configured${NC}"
sleep 2

# Step 2: Package and deploy Lambda functions
echo -e "\n${BLUE}Step 2: Creating Lambda functions...${NC}"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to deploy a Lambda function
deploy_function() {
    local func_name=$1
    local func_path=$2
    local description=$3
    
    echo "Deploying $func_name..."
    
    # Create deployment package
    cd "$func_path"
    zip -r function.zip index.js node_modules/ -q
    
    # Check if function exists
    if aws lambda get-function --function-name $func_name --region $REGION 2>/dev/null; then
        echo "Updating existing function: $func_name"
        aws lambda update-function-code \
            --function-name $func_name \
            --zip-file fileb://function.zip \
            --region $REGION > /dev/null
    else
        echo "Creating new function: $func_name"
        aws lambda create-function \
            --function-name $func_name \
            --runtime nodejs18.x \
            --role $ROLE_ARN \
            --handler index.handler \
            --zip-file fileb://function.zip \
            --timeout 30 \
            --description "$description" \
            --region $REGION > /dev/null
    fi
    
    rm -f function.zip
    cd - > /dev/null
    echo -e "${GREEN}✓ $func_name deployed${NC}"
}

# Install dependencies if needed
echo "Installing dependencies..."
cd "$SCRIPT_DIR/uploadFunc"
npm install --silent 2>/dev/null || true
cd - > /dev/null

# Deploy function
deploy_function "$FUNCTION_NAME_UPLOAD" "$SCRIPT_DIR/uploadFunc" "Handle S3 uploads and track completed days"

sleep 2

# Step 3: Create API Gateway
echo -e "\n${BLUE}Step 3: Creating API Gateway...${NC}"

# Check if API already exists
EXISTING_API=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$EXISTING_API" ]; then
    echo "Creating new REST API: $API_NAME"
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "API for dingziwei.com" \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✓ API created: $API_ID${NC}"
else
    API_ID=$EXISTING_API
    echo -e "${GREEN}✓ API exists: $API_ID${NC}"
fi

sleep 2

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[0].id' \
    --output text)

# Function to create resource and method
create_resource() {
    local resource_name=$1
    local lambda_func=$2
    
    echo "Creating resource /$resource_name..."
    
    # Create resource
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_ID \
        --path-part $resource_name \
        --region $REGION \
        --query 'id' \
        --output text 2>/dev/null || aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart=='$resource_name'].id" \
        --output text)
    
    # Create POST method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method POST \
        --authorization-type NONE \
        --region $REGION > /dev/null 2>&1 || true
    
    # Get Lambda function ARN
    LAMBDA_ARN=$(aws lambda get-function \
        --function-name $lambda_func \
        --region $REGION \
        --query 'Configuration.FunctionArn' \
        --output text)
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method POST \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
        --region $REGION > /dev/null 2>&1 || true
    
    # Grant API Gateway permission to invoke Lambda
    aws lambda add-permission \
        --function-name $lambda_func \
        --statement-id apigateway-access-$RESOURCE_ID \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --region $REGION 2>/dev/null || true
    
    # Create method response with CORS headers
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method POST \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true" \
        --region $REGION > /dev/null 2>&1 || true
    
    # Create integration response with header mapping
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method POST \
        --status-code 200 \
        --response-parameters "method.response.header.Access-Control-Allow-Origin='*'" \
        --region $REGION > /dev/null 2>&1 || true
    
    echo -e "${GREEN}✓ Resource /$resource_name configured${NC}"
}

# Create resource
create_resource "upload" $FUNCTION_NAME_UPLOAD

sleep 2

echo -e "\n${BLUE}Step 4: Configuring OPTIONS for CORS...${NC}"

# Add simple MOCK OPTIONS method to /upload resource for CORS preflight
UPLOAD_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?pathPart=='upload'].id" --output text)

# Create OPTIONS method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $UPLOAD_RESOURCE \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION > /dev/null 2>&1 || true

# Create MOCK integration (no Lambda needed, just return empty)
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $UPLOAD_RESOURCE \
    --http-method OPTIONS \
    --type MOCK \
    --region $REGION > /dev/null 2>&1 || true

# Create method response
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $UPLOAD_RESOURCE \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true" \
    --region $REGION > /dev/null 2>&1 || true

# Create integration response with CORS headers and templates
aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $UPLOAD_RESOURCE \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization',method.response.header.Access-Control-Allow-Methods='GET,POST,OPTIONS',method.response.header.Access-Control-Allow-Origin='*'" \
    --response-templates "application/json='{}'" \
    --region $REGION > /dev/null 2>&1 || true

echo -e "${GREEN}✓ CORS configured${NC}"

sleep 2

# Step 5: Deploy API
echo -e "\n${BLUE}Step 5: Deploying API Gateway...${NC}"

# Check if stage exists
if aws apigateway get-stage --rest-api-id $API_ID --stage-name $STAGE --region $REGION 2>/dev/null; then
    echo "Updating existing deployment..."
    aws apigateway update-stage \
        --rest-api-id $API_ID \
        --stage-name $STAGE \
        --region $REGION > /dev/null
else
    echo "Creating new deployment..."
    DEPLOYMENT=$(aws apigateway create-deployment \
        --rest-api-id $API_ID \
        --stage-name $STAGE \
        --region $REGION \
        --query 'id' \
        --output text)
fi

echo -e "${GREEN}✓ API deployed to stage: $STAGE${NC}"

sleep 1

# Step 6: Get API endpoint
echo -e "\n${BLUE}Step 6: API Endpoint${NC}"

API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
echo -e "${GREEN}✓ API Endpoint: ${API_ENDPOINT}${NC}"

# Summary
echo -e "\n${YELLOW}==================================="
echo "✓ Deployment Complete!"
echo "===================================${NC}"
echo -e "\n${BLUE}Resources Created:${NC}"
echo "  Lambda Functions:"
echo "    - uploadFunc"
echo "    - getCompletedDays"
echo "  API Gateway:"
echo "    - /upload (POST) → uploadFunc"
echo "    - /completed-days (POST) → getCompletedDays"
echo "  IAM Role:"
echo "    - dingziwei-lambda-role (with S3 permissions)"
echo ""
echo -e "${YELLOW}Next Step:${NC}"
echo "Update your script.js with this API endpoint:"
echo ""
echo -e "${GREEN}const API_BASE_URL = '${API_ENDPOINT}';${NC}"
echo ""
echo "Then update line 211 in script.js:"
echo "  const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-east-1.amazonaws.com/prod';"
echo "  ↓"
echo "  const API_BASE_URL = '${API_ENDPOINT}';"
echo ""
