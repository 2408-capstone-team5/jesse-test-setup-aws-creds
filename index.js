const {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  S3Client,
  waitUntilBucketExists,
} = require("@aws-sdk/client-s3");

const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

const getAccountId = async () => {
  const client = new STSClient({ region: "us-east-1" }); // Specify your region
  const command = new GetCallerIdentityCommand({});
  
  try {
    const response = await client.send(command);
    console.log("AWS Account ID:", response.Account);
    return response.Account;
  } catch (error) {
    console.error("Error retrieving account ID:", error);
  }
};

getAccountId();

const bucketName = "aws-config-test-" + Date.now();
const maxWaitTime = 60;

const client = new S3Client({ region: 'us-east-1' }); // No credentials needed at this stage

const createAndCheckS3 = async () => {
  try {
    const { Location } = await client.send(
      new CreateBucketCommand({
        // The name of the bucket, test + milliseconds from Date.now()
        Bucket: bucketName,
      })
    );
    await waitUntilBucketExists(
      { client, maxWaitTime },
      { Bucket: bucketName }
    );
    console.log(`Bucket created with location ${Location}`);
  } catch (caught) {
    if (caught instanceof BucketAlreadyExists) {
      console.error(
        `The bucket "${bucketName}" already exists in another AWS account. Bucket names must be globally unique.`
      );
    }
    // If you try to create and you already own a bucket in that region with the same name, this
    // error will not be thrown. Instead, the call will return successfully
    // and the ACL on that bucket will be reset.
    else if (caught instanceof BucketAlreadyOwnedByYou) {
      console.error(
        `The bucket "${bucketName}" already exists in this AWS account.`
      );
    } else {
      throw caught;
    }
  }
};

createAndCheckS3();
