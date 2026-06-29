# AWS Deployment Guide for dingziwei.com

This guide explains how to deploy all AWS resources needed for your backend.

**Choose one of three deployment methods:**

---

## Method 1: Automated Bash Script (Recommended ⭐)

This is the easiest way - one command deploys everything.

### Prerequisites
- AWS CLI configured with credentials
- Bash shell (macOS/Linux)
- Node.js installed locally

### Steps

1. **Navigate to the lambda directory**
   ```bash
   cd /Users/jinan/Desktop/personal/ilovedingziwei/lambda
   ```

2. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

3. **Wait for completion** (~2-3 minutes)
   - The script will:
     - Create IAM execution role
     - Deploy both Lambda functions
     - Create API Gateway with resources
     - Enable CORS
     - Deploy API and provide endpoint URL

4. **Copy the API endpoint** from the output
   ```
   ✓ API Endpoint: https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod
   ```

5. **Update script.js** with your API endpoint
   - Open `/Users/jinan/Desktop/personal/ilovedingziwei/script.js`
   - Find line 211: `const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL...'`
   - Replace with your actual endpoint from step 4

6. **Test the deployment**
   - Open your website in a browser
   - Click on a calendar day and try uploading an image
   - Check if the upload succeeds

---

## Method 2: CloudFormation (Infrastructure as Code)

Use AWS CloudFormation for template-based deployment.

### Prerequisites
- AWS CLI configured
- AWS CloudFormation access

### Steps

1. **Deploy the stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name dingziwei-stack \
     --template-body file:///Users/jinan/Desktop/personal/ilovedingziwei/lambda/template.yaml \
     --capabilities CAPABILITY_NAMED_IAM \
     --region ap-east-1
   ```

2. **Wait for stack creation** (~3-5 minutes)
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name dingziwei-stack \
     --region ap-east-1
   ```

3. **Get the API endpoint**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name dingziwei-stack \
     --region ap-east-1 \
     --query 'Stacks[0].Outputs[0].OutputValue' \
     --output text
   ```

4. **Update script.js** with the endpoint (same as Method 1, step 5)

### To Update the Stack Later
```bash
aws cloudformation update-stack \
  --stack-name dingziwei-stack \
  --template-body file:///Users/jinan/Desktop/personal/ilovedingziwei/lambda/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-east-1
```

### To Delete the Stack
```bash
aws cloudformation delete-stack --stack-name dingziwei-stack --region ap-east-1
```

---

## Method 3: Manual AWS Console Setup

If you prefer the graphical interface, follow these steps:

### Step 1: Create IAM Role

1. Go to AWS Console → IAM → Roles
2. Click "Create Role"
3. Select "Lambda" as the service
4. Click "Next"
5. Create inline policy with name `dingziwei-s3-policy`:
   ```json
   {
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
   }
   ```
6. Name the role `dingziwei-lambda-role`
7. Create role

### Step 2: Deploy uploadFunc Lambda

1. Go to AWS Console → Lambda → Functions
2. Click "Create function"
3. Name: `uploadFunc`
4. Runtime: Node.js 18.x
5. Execution role: Choose `dingziwei-lambda-role`
6. Click "Create function"
7. Copy code from `/lambda/uploadFunc/index.js` into Code source
8. Click "Deploy"
9. Test: 
   - Open "Test" tab
   - Event JSON: `{"action": "getPresignedUrl"}`
   - Click "Test"
   - Should return uploadURL

### Step 3: Deploy getCompletedDays Lambda

1. Click "Create function"
2. Name: `getCompletedDays`
3. Runtime: Node.js 18.x
4. Execution role: Choose `dingziwei-lambda-role`
5. Click "Create function"
6. Copy code from `/lambda/getCompletedDays/index.js`
7. Click "Deploy"
8. Test:
   - Open "Test" tab
   - Event JSON: `{}`
   - Click "Test"
   - Should return completedDays array

### Step 4: Create API Gateway

1. Go to AWS Console → API Gateway
2. Click "Create API"
3. Choose "REST API"
4. Name: `dingziwei-api`
5. Click "Create API"

### Step 5: Create /upload Resource

1. Click on "/" (root)
2. Click "Create Resource"
3. Name: `upload`
4. Click "Create Resource"
5. With `/upload` selected, click "Create Method" → POST
6. Integration type: Lambda Function Proxy
7. Lambda Function: `uploadFunc`
8. Click "Save"
9. Confirm: Click "OK"

### Step 6: Create /completed-days Resource

1. Click on "/" (root)
2. Click "Create Resource"
3. Name: `completed-days`
4. Click "Create Resource"
5. With `/completed-days` selected, click "Create Method" → POST
6. Integration type: Lambda Function Proxy
7. Lambda Function: `getCompletedDays`
8. Click "Save"

### Step 7: Enable CORS

1. For each resource (`/upload`, `/completed-days`, `/`):
   - Select the resource
   - Click "Enable CORS"
   - Click "Enable CORS and replace existing CORS headers"
   - Click "Yes, replace existing values"

### Step 8: Deploy API

1. Click "Deploy API"
2. Deployment stage: `prod`
3. Click "Deploy"
4. Copy the "Invoke URL" (e.g., `https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod`)

### Step 9: Update script.js

1. Open `script.js`
2. Find line 211: `const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL...'`
3. Replace with your API endpoint from step 8

---

## Verification

After deployment, verify everything works:

### Test Upload Function
```bash
curl -X POST \
  https://YOUR_API_ENDPOINT/upload \
  -H "Content-Type: application/json" \
  -d '{"action":"getPresignedUrl"}'
```

Expected response:
```json
{
  "uploadURL": "https://dingziwei-app-bucket.s3.ap-east-1.amazonaws.com/...",
  "fileName": "1234567890-abc123.jpg",
  "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg"
}
```

### Test Completed Days Function
```bash
curl -X POST \
  https://YOUR_API_ENDPOINT/completed-days \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "success": true,
  "month": "2026-06",
  "completedDays": [],
  "count": 0
}
```

### Test in Browser
1. Open `https://ilovedingziwei.com` (or localhost)
2. Click on a calendar day
3. Click upload button
4. Select an image
5. Should see: "获取上传链接..." → "上传中..." → "保存记录..." → "✓ 上传成功！"
6. Calendar day should be marked with ✓

---

## Troubleshooting

### "Function not found" error
- Verify Lambda functions are created: `aws lambda list-functions --region ap-east-1`
- Check the function names match exactly

### CORS errors in browser
- Verify CORS is enabled on API Gateway
- Check API is deployed to a stage

### S3 upload fails
- Verify IAM role has S3 permissions
- Check bucket name in Lambda code
- Verify bucket exists: `aws s3 ls`

### API returns 500 error
- Check Lambda CloudWatch logs: `aws logs describe-log-groups --region ap-east-1`
- Verify AWS credentials are configured

---

## Cost Breakdown

Monthly costs in ap-east-1 region:

| Service | Cost |
|---------|------|
| Lambda invocations | ~$0.50 |
| API Gateway | ~$0.35 |
| S3 storage (10GB) | ~$0.23 |
| S3 requests | ~$0.40 |
| **Total** | **~$1.50** |

---

## Next Steps

1. ✅ Deploy resources using one of the three methods
2. ✅ Update script.js with API endpoint
3. ✅ Test website upload functionality
4. ✅ Deploy website to GitHub Pages
5. Custom domain already configured

---

## Support

If you encounter issues:

1. Check AWS CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/uploadFunc --follow
   aws logs tail /aws/lambda/getCompletedDays --follow
   ```

2. Test API endpoint with curl (see Verification section)

3. Verify IAM permissions are correct

4. Check S3 bucket exists and Lambda role has access
