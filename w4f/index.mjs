import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { clear } from "console";
import { Readable } from "stream";

export const handler = async (event) => {
    const bucketName = event.bucketName || process.env.bucket_name; // Replace with default if not provided
    //const filePath = process.env.file_path;

    const apiUrl = process.env.api_url;
    
    // Create S3 client
    const s3Client = new S3Client({ region: "us-east-1" });
    
    try {
        const objectKeys = await listObjectsInBucket(s3Client, bucketName);

        for (const objectKey of objectKeys) {
            const objectData = await getObjectFromBucket(s3Client, bucketName, objectKey);

            // Check if objectData is empty, if yes, skip processing
            if (!isEmptyObject(objectData)) {
                // Send POST request
                console.log("Posting to ServiceNow begins...");
                console.log(`Object "${objectKey}":\n`, objectData);
                const postResponse = await postToSNOW(apiUrl, objectData);
                console.log(postResponse);
                
                // Move the innermost folder to the new bucket
                //const newBucketName = "monitor-s3bucket-olddata";
                //const newObjectKey = objectKey.substring(objectKey.lastIndexOf('/') + 1);
                //console.log("I will move these objects to different bucket: ", newBucketName, "/", newObjectKey);
                //await moveObjectToBucket(s3Client, bucketName, newBucketName, objectKey, newObjectKey);
                
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

async function listObjectsInBucket(s3Client, bucketName) {
    try {
        const command = new ListObjectsV2Command({ Bucket: bucketName });
        const response = await s3Client.send(command);

        const objectKeys = response.Contents.map((object) => object.Key);
        return objectKeys;
    } catch (err) {
        console.error("Error listing objects:", err);
        throw err;
    }
}

async function getObjectFromBucket(s3Client, bucketName, objectKey) {
    try {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
        const response = await s3Client.send(command);
        const objectString = await streamToString(response.Body);
        let convertedArray = [objectString];
        convertedArray = removeSingleQuotes(JSON.stringify(convertedArray));
        console.log("Converted Array is: ", JSON.stringify(convertedArray));
        let cleanformattedRecord = removeSingleQuotes(convertedArray);
        cleanformattedRecord = removeBackslashes(cleanformattedRecord);
        cleanformattedRecord = removeDoubleQuoteAfterChar(cleanformattedRecord, ']');
        cleanformattedRecord = removeDoubleQuoteBeforeChar(cleanformattedRecord, '[');
        console.log("Clean Formatted Record:", cleanformattedRecord);

        // const jsonData = JSON.parse(cleanformattedRecord);
        // let recordsSkipped = 0;
        // for (const record of jsonData) {
        //     if (isEmptyObject(record)) {
        //         recordsSkipped++;
        //     }
        // }

        // if (recordsSkipped > 0) {
        //     console.log(`Skipped ${recordsSkipped} record(s) with empty values.`);
        // }

        return cleanformattedRecord;
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
        const jsonData = JSON.stringify(data);
        console.log("Stringified before cleaning:", jsonData);
        let cleanData = removeBackslashes(jsonData);
        cleanData = removeSingleQuotes(cleanData); 
        cleanData = removeDoubleQuoteAfterChar(cleanData, '[');
        cleanData = removeDoubleQuoteAfterChar(cleanData, ']');
        cleanData = removeDoubleQuoteBeforeChar(cleanData, ']');
        cleanData = removeDoubleQuoteBeforeChar(cleanData, '[');
        console.log("Clean Data sending to ServiceNow:", cleanData);

        const response = await axios.post(apiUrl, cleanData, {
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                username: process.env.username,
                password: process.env.password
            }
        });
        
        if (response.status >= 200 && response.status < 300) {
            const responseData = response.data;
            console.log("Response from API:", responseData);
            return {
                statusCode: 200,
                body: JSON.stringify(responseData),
            };
        } else {
            console.error(`Received HTTP status code ${response.status}`);
            return {
                statusCode: response.status,
                body: `Received HTTP status code ${response.status}: ${response.statusText}`,
            };
        }
    } catch (error) {
        console.error("Error during POST request:", error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
}

function removeBackslashes(jsonString) {
    const cleanedJsonString = jsonString.replace(/\\/g, '');
    return cleanedJsonString;
}

function removeSingleQuotes(jsonString) {
    const cleanedJsonString = jsonString.replace(/'/g, '');
    return cleanedJsonString;
}

function removeDoubleQuoteBeforeChar(jsonString, targetChar) {
    const escapedTargetChar = targetChar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`"(?=${escapedTargetChar})`, 'g');
    const cleanedJsonString = jsonString.replace(regex, '');
    return cleanedJsonString;
}

function removeDoubleQuoteAfterChar(jsonString, targetChar) {
    const escapedTargetChar = targetChar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<=${escapedTargetChar})"`, 'g');
    const cleanedJsonString = jsonString.replace(regex, '');
    return cleanedJsonString;
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

async function moveObjectToBucket(s3Client, sourceBucket, destinationBucket, sourceKey, destinationKey) {
    try {
        const copyCommand = new CopyObjectCommand({
            CopySource: `${sourceBucket}/${sourceKey}`,
            Bucket: destinationBucket,
            Key: destinationKey
        });
        await s3Client.send(copyCommand);

        const deleteCommand = new DeleteObjectCommand({
            Bucket: sourceBucket,
            Key: sourceKey
        });
        await s3Client.send(deleteCommand);

        console.log(`Object "${sourceKey}" moved to bucket "${destinationBucket}" with key "${destinationKey}"`);
    } catch (err) {
        console.error(`Error moving object "${sourceKey}" to bucket "${destinationBucket}":`, err);
        throw err;
    }
}
