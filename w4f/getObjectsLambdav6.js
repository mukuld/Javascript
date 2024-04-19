// Import necessary packages
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import { Readable } from "stream";

// Handler function for AWS Lambda
export const handler = async (event) => {
    // Get the bucket name from the event or environment variable
    const bucketName = event.bucketName || process.env.bucket_name;

    // Create S3 client
    const s3Client = new S3Client({ region: "us-east-1" });

    try {
        // List all objects in the bucket
        const objectKeys = await listObjectsInBucket(s3Client, bucketName);

        // Process each object
        for (const objectKey of objectKeys) {
            // Retrieve the object from the bucket
            const jsonObject = await getObjectFromBucket(s3Client, bucketName, objectKey);

            // Optionally, send the JSON object to an external API
            const apiUrl = process.env.api_url;
            if (apiUrl) {
                await postToSNOW(apiUrl, jsonObject);
            }

            console.log(`Processed object "${objectKey}" and wrote JSON file.`);
        }

        return {
            statusCode: 200,
            body: `Successfully processed objects in bucket: ${bucketName}`,
        };
    } catch (err) {
        console.error("Error processing objects:", err);
        return {
            statusCode: 500,
            body: `Error: ${err.message}`,
        };
    }
};

// Function to list all objects in an S3 bucket
async function listObjectsInBucket(s3Client, bucketName) {
    try {
        const command = new ListObjectsV2Command({ Bucket: bucketName });
        const response = await s3Client.send(command);

        // Extract object keys from the response
        const objectKeys = response.Contents.map((object) => object.Key);
        return objectKeys;
    } catch (err) {
        console.error("Error listing objects:", err);
        throw err;
    }
}

// Function to retrieve an object from an S3 bucket and wrap it in an array inside a JSON object with the key "records"
async function getObjectFromBucket(s3Client, bucketName, objectKey) {
    try {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
        const response = await s3Client.send(command);

        // Convert the response.Body stream to a UTF-8 string
        const objectString = await streamToString(response.Body);
        
        // Wrap the object string in an array and store it in a JSON object with the key "records"
        const jsonObject = {
            records: [objectString]
        };

 
        return jsonObject;
    } catch (err) {
        console.error(`Error retrieving and processing object "${objectKey}":`, err);
        throw err;
    }
}

// Function to convert a stream to a UTF-8 string
async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8'); // Convert to UTF-8 string
}

// Function to post data to an external API using fetch
async function postToSNOW(apiUrl, data) {
    try {
        // Use fetch to send a POST request to the API URL with the data
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${process.env.username}:${process.env.password}`).toString('base64')}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Success: parse and log the JSON response
            const responseData = await response.json();
            console.log("Response from API:", responseData);
            return {
                statusCode: 200,
                body: responseData, // Return JSON object directly
            };
        } else {
            // Handle HTTP status codes that indicate errors
            console.error(`Received HTTP status code ${response.status}: ${response.statusText}`);
            return {
                statusCode: response.status,
                body: `Received HTTP status code ${response.status}: ${response.statusText}`,
            };
        }
    } catch (error) {
        // Handle errors during the POST request
        console.error("Error during POST request:", error);
        return {
            statusCode: 500,
            body: { error: "Internal Server Error", details: error.message }, // Return JSON object directly
        };
    }
}
