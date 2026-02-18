# Sample S3 Static Website - Product Storefront

A fully client-side web application for managing and displaying products, hosted on AWS S3 and CloudFront. This application consists of a public storefront for customers to view products and an admin panel for inventory management.

## Features

### Storefront (index.html)
- Display all products with images, names, descriptions, prices, and quantities
- Responsive grid layout
- Real-time stock status indicators (In Stock, Low Stock, Out of Stock)
- Clean, modern UI

![Storefront Demo](https://github.com/user-attachments/assets/20743aae-dddc-4680-b05a-4224921c6dc3)

### Admin Panel (admin.html)
- Add new products with image upload
- View all existing products
- Delete products
- Real-time image preview
- Form validation

![Admin Panel Demo](https://github.com/user-attachments/assets/187c56c0-6267-48d3-90f7-fe69bfd6cbc6)

## Architecture

This is a **completely client-side application** with no backend server. All data is stored in AWS S3:
- Product images are stored in the `images/` folder in your S3 bucket
- Product data (name, description, price, quantity, image URLs) is stored in a `products.json` file in your S3 bucket
- The AWS SDK for JavaScript is used to interact with S3 directly from the browser

## Prerequisites

1. **AWS Account** - You'll need an active AWS account
2. **S3 Bucket** - A publicly accessible S3 bucket configured for static website hosting
3. **AWS Cognito Identity Pool** - For unauthenticated access to S3 from the browser

## Setup Instructions

### Step 1: Create an S3 Bucket

1. Log in to the AWS Console
2. Go to S3 and create a new bucket
3. Enable **Static website hosting** in the bucket properties
   - Set index document to `index.html`
4. Configure **Bucket Policy** to allow public read access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

5. Configure **CORS** settings:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Step 2: Create a Cognito Identity Pool

1. Go to AWS Cognito in the AWS Console
2. Click **Create new identity pool**
3. Give it a name (e.g., "ProductStorefrontIdentityPool")
4. Check **Enable access to unauthenticated identities**
5. Create the pool
6. Note the **Identity Pool ID** (looks like `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
7. In the IAM roles created, edit the unauthenticated role policy to allow S3 access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
        }
    ]
}
```

### Step 3: Configure the Application

1. Edit `config.js` and update the following values:
   ```javascript
   bucketName: 'YOUR_BUCKET_NAME',          // Your S3 bucket name
   region: 'us-east-1',                      // Your AWS region
   identityPoolId: 'YOUR_IDENTITY_POOL_ID', // Your Cognito Identity Pool ID
   ```

### Step 4: Deploy to S3

Upload all files to your S3 bucket:
- index.html
- admin.html
- styles.css
- config.js
- storefront.js
- admin.js

You can use the AWS CLI:
```bash
aws s3 sync . s3://YOUR_BUCKET_NAME/ --exclude ".git/*" --exclude "README.md"
```

Or use the AWS Console to upload files manually.

### Step 5: (Optional) Set up CloudFront

1. Go to CloudFront in the AWS Console
2. Create a new distribution
3. Set the origin to your S3 bucket
4. Configure default root object as `index.html`
5. Wait for deployment (can take 15-20 minutes)
6. Access your site via the CloudFront URL

## Usage

### Adding Products

1. Navigate to the admin panel: `https://your-domain/admin.html`
2. Fill in the product details:
   - Product Name
   - Description
   - Price
   - Quantity
   - Upload an image
3. Click "Add Product"
4. The product will be uploaded to S3 and appear in the storefront

### Viewing Products

1. Navigate to the storefront: `https://your-domain/index.html` (or just your domain root)
2. All products will be displayed in a responsive grid
3. Each product shows:
   - Product image
   - Name and description
   - Price
   - Stock status

### Deleting Products

1. In the admin panel, scroll to the "Current Products" section
2. Click the "Delete" button on any product
3. Confirm the deletion
4. The product will be removed from S3

## Demo Pages

To preview the UI without AWS configuration, you can use the demo pages:
- `demo-storefront.html` - Shows the storefront with sample products
- `demo-admin.html` - Shows the admin panel interface

These demo pages display static sample data and don't require AWS credentials.

## File Structure

```
.
├── index.html              # Main storefront page
├── admin.html              # Admin/inventory management page
├── styles.css              # Shared CSS styles
├── config.js               # AWS configuration
├── config.template.js      # Configuration template
├── storefront.js           # Storefront functionality
├── admin.js                # Admin panel functionality
├── demo-storefront.html    # Demo/preview page for storefront
├── demo-admin.html         # Demo/preview page for admin
└── README.md               # This file
```

## Security Considerations

1. **Admin Access**: The admin panel is publicly accessible. For production use, consider:
   - Adding authentication (e.g., AWS Cognito User Pools)
   - Restricting admin operations to authenticated users only
   - Using separate IAM roles for read-only (storefront) and write (admin) operations

2. **CORS**: The current setup allows all origins. For production, restrict to your specific domain.

3. **Bucket Permissions**: Follow the principle of least privilege. Only grant necessary permissions.

## Customization

### Styling
Edit `styles.css` to customize the look and feel of the application.

### Product Fields
To add additional product fields (e.g., category, SKU):
1. Update the HTML forms in `admin.html`
2. Modify the `addProductToS3()` function in `admin.js` to include new fields
3. Update the display functions in both `storefront.js` and `admin.js`

### Image Storage
Images are stored with timestamps to ensure uniqueness. You can modify the naming convention in the `uploadImageToS3()` function in `admin.js`.

## Browser Support

This application requires a modern browser with support for:
- ES6 JavaScript features
- Promises and async/await
- FileReader API
- Fetch API (through AWS SDK)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Products not loading
- Check browser console for errors
- Verify S3 bucket permissions and CORS configuration
- Ensure `config.js` has correct bucket name and region
- Check that Cognito Identity Pool allows unauthenticated access

### Image upload fails
- Verify IAM role has `s3:PutObject` and `s3:PutObjectAcl` permissions
- Check file size (S3 has limits)
- Ensure CORS is configured correctly

### Access Denied errors
- Check Cognito Identity Pool unauthenticated role permissions
- Verify S3 bucket policy allows public read access
- Ensure bucket CORS allows the necessary methods

## Cost Considerations

This solution uses:
- **S3**: Storage costs for images and JSON data (minimal)
- **S3 Requests**: GET/PUT requests (very low for small sites)
- **CloudFront** (optional): Data transfer and requests
- **Cognito**: Free tier includes 50,000 monthly active users

For a small storefront with moderate traffic, costs should be under $1-5/month.

## License

This is a sample project for demonstration purposes. Feel free to use and modify as needed.

## Support

For issues or questions, please refer to AWS documentation:
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Cognito Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html)