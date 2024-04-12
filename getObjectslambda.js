import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const handler = async (event) => {
  // Get the bucket name from the event object (optional)
  const bucketName = event.bucketName || 'test-bahrain-hayyas'; // Replace with default if not provided

  try {
    // Create S3 client
    const s3Client = new S3Client({ region: "us-west-2" }); // You can configure region via environment variable

    const objectKeys = await listObjectsInBucket(s3Client, bucketName);

    for (const objectKey of objectKeys) {
      const objectData = await getObjectFromBucket(s3Client, bucketName, objectKey);
      const objectString = await streamToString(objectData);
      console.log(`Object "${objectKey}":\n`, objectString); // Log object data to CloudWatch Logs
    }

    return {
      statusCode: 200,
      body: 'Successfully processed objects in bucket: ' + bucketName,
    };
  } catch (err) {
    console.error("Error processing objects:", err);
    return {
      statusCode: 500,
      body: 'Error: ' + err.message,
    };
  }
};

async function listObjectsInBucket(s3Client, bucketName) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);

    // Extract object keys from the response
    const objectKeys = response.Contents.map((object) => object.Key);

    // Return array of object keys
    return objectKeys;
  } catch (err) {
    console.error("Error listing objects:", err);
    throw err;
  }
}

async function getObjectFromBucket(s3Client, bucketName, objectKey) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3Client.send(command);

    // Stream the object data
    return response.Body;
  } catch (err) {
    console.error(`Error retrieving object "${objectKey}":`, err);
    throw err;
  }
}

async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => {
      const dataString = Buffer.concat(chunks).toString("utf8");
      console.log(dataString); // Log to CloudWatch Logs
      resolve(dataString);
    });
  });
}
