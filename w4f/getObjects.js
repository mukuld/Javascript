const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

// Create S3 client
const s3Client = new S3Client({ region: "us-west-2" }); // Replace "your-region" with your desired AWS region

// Function to list all objects in a bucket
async function listObjectsInBucket(bucketName) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);

    // Extract object keys from the response
    const objectKeys = response.Contents.map((object) => object.Key);

    // Return array of object keys
    console.log("Object in bucket")
    return objectKeys;
  } catch (err) {
    console.error("Error listing objects:", err);
    throw err;
  }
}

// Function to retrieve an object from S3
async function getObjectFromBucket(bucketName, objectKey) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3Client.send(command);

    // Extract object data from the response
    const objectData = await StreamToString(response.Body);

    // Return the object data
    return objectData;
  } catch (err) {
    console.error(`Error retrieving object "${objectKey}":`, err);
    throw err;
  }
}

// Helper function to convert a Readable stream to a string
 async function StreamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    console.log("Test string")
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

// Replace "your-bucket-name" with your S3 bucket name
const bucketName = "test-bahrain-hayyas";

// List all objects in the bucket and retrieve each object
listObjectsInBucket(bucketName)
  .then(async (objectKeys) => {
    for (const objectKey of objectKeys) {
      const objectData = await getObjectFromBucket(bucketName, objectKey);
      console.log(`Object "${objectKey}":\n`, objectData);
    }
  })
  .catch((err) => console.error("Error processing objects:", err));
