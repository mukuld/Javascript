import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { Readable } from "stream";

export const handler = async (event) => {
    const bucketName = event.bucketName || process.env.bucket_name; // Replace with default if not provided
    const fileName = process.env.file_name;

    const apiUrl = process.env.apiURL;
    
    // Create S3 client
    const s3Client = new S3Client({ region: "us-east-1" });
    
    try {
        const objectKeys = await listObjectsInBucket(s3Client, bucketName, fileName);

        for (const objectKey of objectKeys) {
            if (objectKey !== fileName) {
                continue;
            } else {

                const objectData = await getObjectFromBucket(s3Client, bucketName, objectKey);
                const objectString = await streamToString(objectData);
                
                // Send POST request
                const postResponse = await postToSNOW(apiUrl, objectString);
                console.log("Posting to ServiceNow begins...");
                console.log(`Object "${objectKey}":\n`, objectString);
            }
        }

        return {
            statusCode: 200,
            body: `Successfully posted to ServiceNow and processed objects in bucket: ${bucketName}`,
        };
    } catch (err) {
        console.error("Error processing objects:", err);
        return {
            statusCode: 500,
            body: `Error: ${err.message}`,
        };
    }
};

async function listObjectsInBucket(s3Client, bucketName,fileName) {
    try {
        const command = new ListObjectsV2Command({ 
            Bucket: bucketName
         });
        const response = await s3Client.send(command);

        const objectKeys = response.Contents.map((object) => object.Key);
        console.log("File name is: ", objectKeys.slice(-fileName.length));
        return objectKeys;
    } catch (err) {
        console.error("Error listing objects:", err);
        throw err;
    }
}

async function getObjectFromBucket(s3Client, bucketName, objectKey) {
    try {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
        console.log("The command is: ", command);
        const response = await s3Client.send(command);
        
        return response.Body;
    } catch (err) {
        console.error(`Error retrieving object "${objectKey}":`, err);
        throw err;
    }
}

async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

async function postToSNOW(apiUrl, data) {
    try {
        // Send POST request to the API URL with the data
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                username: process.env.username,
                password: process.env.password
            }
        });
        
        // Check HTTP status code and handle different cases
        if (response.status >= 200 && response.status < 300) {
            // Success: Log the response data and return it
            const responseData = response.data;
            console.log("Response from API:", responseData);
            return {
                statusCode: 200,
                body: JSON.stringify(responseData),
            };
        } else {
            // Handle other status codes appropriately
            console.error(`Received HTTP status code ${response.status}`);
            return {
                statusCode: response.status,
                body: `Received HTTP status code ${response.status}: ${response.statusText}`,
            };
        }
    } catch (error) {
        // Handle errors during POST request
        console.error("Error during POST request:", error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
}

/*
async function postToSNOW(apiUrl, data) {
    try {
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error("Error during POST request:", error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
}
*/