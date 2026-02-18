// Configuration for AWS S3
// Replace these values with your actual S3 bucket configuration
const config = {
    // S3 Bucket name where products and images will be stored
    bucketName: 'YOUR_BUCKET_NAME',
    
    // AWS Region where your bucket is located
    region: 'us-east-1',
    
    // Cognito Identity Pool ID for unauthenticated access
    // You need to create an Identity Pool in AWS Cognito and allow unauthenticated access
    identityPoolId: 'YOUR_IDENTITY_POOL_ID',
    
    // File name for storing product data in S3
    productsFileName: 'products.json',
    
    // Folder name for storing product images
    imagesFolderName: 'images/'
};

// Initialize AWS SDK
AWS.config.region = config.region;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: config.identityPoolId
});

// Create S3 service object
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: config.bucketName }
});
