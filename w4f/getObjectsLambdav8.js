    import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
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
                    //const objectString = await streamToString(objectData);
                    console.log("Object Data is: ", objectData);
                    
                    // Send POST request
                    console.log("Posting to ServiceNow begins...");
                    console.log(`Object "${objectKey}":\n`, objectData);
                    const postResponse = await postToSNOW(apiUrl, objectData);
                    console.log(postResponse)
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
            //const objectData = response.Body;
            const objectString = await streamToString(response.Body);
            //console.log("Object String is:", objectString);
            let convertedArray = [objectString];
            convertedArray = removeSingleQuotes(JSON.stringify(convertedArray));
            console.log("Converted Array is: ", JSON.stringify(convertedArray));
            let cleanformattedRecord = removeSingleQuotes(convertedArray);
            cleanformattedRecord = removeBackslashes(cleanformattedRecord);
            cleanformattedRecord = removeDoubleQuoteAfterChar(cleanformattedRecord, ']');
            cleanformattedRecord = removeDoubleQuoteBeforeChar(cleanformattedRecord, '[');
            console.log("Clean Formatted Record:", cleanformattedRecord);
            
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
            //cleanData = cleanData.slice(1);

            console.log("Clean Data sending to ServiceNow:", cleanData);
        // const jsonString = JSON.stringify(data, circularReplacer);
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
            //     // Success: Log the response data and return it
                const responseData = response.data;
                console.log("Response from API:", responseData);
                return {
                    statusCode: 200,
                    body: JSON.stringify(responseData),
                };
            } else {
            //     // Handle other status codes appropriately
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

    function removeBackslashes(jsonString) {
        // Use the replace method to remove backslashes
        // Replace "\\" (double backslashes) with a single backslash
        const cleanedJsonString = jsonString.replace(/\\/g, '');
        return cleanedJsonString;
    }

    function removeSingleQuotes(jsonString) {
        // Use the replace method to remove backslashes
        // Replace "'" (single quotes) with a single backslash
        const cleanedJsonString = jsonString.replace(/'/g, '');

        return cleanedJsonString;
    }


    function removeDoubleQuoteBeforeChar(jsonString, targetChar) {
        // Escape the target character to avoid any issues in the regular expression
        const escapedTargetChar = targetChar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Create a regular expression to match a double quote followed by the escaped target character
        const regex = new RegExp(`"(?=${escapedTargetChar})`, 'g');
        
        // Use the replace method to remove the double quotes that precede the escaped target character
        const cleanedJsonString = jsonString.replace(regex, '');
        
        return cleanedJsonString;
    }


    function removeDoubleQuoteAfterChar(jsonString, targetChar) {
        // Escape the target character to avoid any issues in the regular expression
        const escapedTargetChar = targetChar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Create a regular expression to match the escaped target character followed by a double quote
        const regex = new RegExp(`(?<=${escapedTargetChar})"`, 'g');
        
        // Use the replace method to remove the double quotes that follow the escaped target character
        const cleanedJsonString = jsonString.replace(regex, '');
        
        return cleanedJsonString;
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