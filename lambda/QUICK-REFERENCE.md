# Quick Reference - Deployment

## 🚀 Deploy in 3 Steps

### Step 1: Run Deployment Script
```bash
cd /Users/jinan/Desktop/personal/ilovedingziwei/lambda
./deploy.sh
```

⏱️ Wait 2-3 minutes for completion

### Step 2: Copy API Endpoint
Script output will show:
```
✓ API Endpoint: https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod
```

### Step 3: Update script.js
Find line ~211 in `/Users/jinan/Desktop/personal/ilovedingziwei/script.js`:
```javascript
const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-east-1.amazonaws.com/prod';
```

Replace with your endpoint from Step 2 ⬆️

---

## ✅ Test the Deployment

### In Terminal
```bash
# Test upload endpoint
curl -X POST \
  https://YOUR_API_ENDPOINT/upload \
  -H "Content-Type: application/json" \
  -d '{"action":"getPresignedUrl"}'

# Test completed-days endpoint
curl -X POST \
  https://YOUR_API_ENDPOINT/completed-days \
  -H "Content-Type: application/json" \
  -d '{}'
```

### In Browser
1. Open `https://ilovedingziwei.com`
2. Click a calendar day
3. Select an image to upload
4. Should show: "✓ 上传成功！"
5. Calendar day marked with ✓

---

## 📊 What Gets Created

| Resource | Name |
|----------|------|
| Lambda 1 | uploadFunc |
| Lambda 2 | getCompletedDays |
| IAM Role | dingziwei-lambda-role |
| API Gateway | dingziwei-api |
| API Resources | /upload, /completed-days |
| Stage | prod |

---

## 🔍 Verify Deployment

### Check Lambda Functions
```bash
aws lambda list-functions --region ap-east-1 | grep -E "uploadFunc|getCompletedDays"
```

### Check API Gateway
```bash
aws apigateway get-rest-apis --region ap-east-1
```

### Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/uploadFunc --follow
aws logs tail /aws/lambda/getCompletedDays --follow
```

---

## 💰 Monthly Cost

| Item | Cost |
|------|------|
| Lambda calls | ~$0.50 |
| API Gateway | ~$0.35 |
| S3 storage | ~$0.23 |
| S3 requests | ~$0.40 |
| **Total** | **~$1.50** |

(vs. $15/month with RDS - you're saving $13.50/month! 🎉)

---

## � File Structure

```
lambda/
├── deploy.sh              # Bash deployment script ⭐
├── DEPLOYMENT.md          # Complete guide
├── README.md              # Folder readme
├── QUICK-REFERENCE.md     # This file
├── uploadFunc/
│   ├── index.js
│   ├── package.json
│   └── README.md
├── getCompletedDays/
│   ├── index.js
│   ├── package.json
│   └── README.md
```

---

## ⚠️ Important Notes

1. **Region:** All resources created in `ap-east-1` (Hong Kong)
2. **Bucket:** Uses existing `dingziwei-app-bucket` (no creation needed)
3. **Credentials:** Requires AWS CLI configured with valid credentials
4. **Cost:** Minimal - stays within free tier for small usage

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "aws: command not found" | Install AWS CLI: `brew install awscli` |
| "Permission denied" | Make script executable: `chmod +x deploy.sh` |
| "InvalidParameterValue" | Verify AWS credentials: `aws sts get-caller-identity` |
| CORS errors | Re-run deploy.sh (it enables CORS automatically) |
| "NoSuchKey" on first run | Normal - creates tracking file on first upload |

---

## 🎯 Next: Deploy Website

After Lambda deployment:

1. ✅ Commit changes to GitHub
   ```bash
   git add .
   git commit -m "Add Lambda backend APIs"
   git push
   ```

2. ✅ GitHub Pages auto-deploys website

3. ✅ Visit `https://ilovedingziwei.com` and test!

---

**Questions? See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide.**
