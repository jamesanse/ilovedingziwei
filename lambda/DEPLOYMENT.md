# AWS Deployment Guide for dingziwei.com

This guide explains how to deploy all AWS resources needed for your backend.

---

## Automated Bash Script Deployment

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

## Verification

After deployment, verify everything works:

### Test Upload Function
```bash
curl -X POST \
  https://0awq3ahyhi.execute-api.ap-east-1.amazonaws.com/prod/upload \
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
  https://0awq3ahyhi.execute-api.ap-east-1.amazonaws.com/prod/completed-days \
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
1. Open `https://ilovedingziwei.com`
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
