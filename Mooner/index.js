import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export const handler = async (event) => {
  const client = new SecretsManagerClient({
    region: "us-west-2",
  });
  const s3Client = new S3Client({
    region: "us-west-2",
  });
  //const secretName = 'aws/transfer/s-b8823c26f62f4a8e9/test123';
  const secretName = 'mooner';
  console.log("Input from Server", event);
  
  // Extract username and password from the event
  const { username, password } = event;
  //console.log("User name is: ", username);
  //console.log("Password is:", password)
  
  try {
    // Retrieve secret from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);
    
    if ('SecretString' in data) {
      const secret = JSON.parse(data.SecretString);
      console.log("The secret is:", secret);
      console.log("Username from manager is:", secret.username);
      console.log("Username from Server is:", event.username);
      console.log("Secret from manager is:", secret.password);
      console.log("Secret from Server is:", event.password);
      console.log("Type of password object from server: ", typeof(event.password));
      console.log("Type of password object from secret: ", typeof(secret.password));
      
      secret.password === event.password ? console.log("Same password") : console.log("Different Password");

      // Validate the username and password
      if (secret.username == event.username && secret.password == event.password) {
        
        // Authentication successful, list S3 buckets
        const listBucketsCommand = new ListBucketsCommand({});
        const bucketData = await s3Client.send(listBucketsCommand);
        
        return {
          StatusCode: 200,
          UserName: username,
          Policy: "access-pass",
          Buckets: bucketData.Buckets
        };
      } else {
        // Authentication failed
        return {
          StatusCode: 400,
          Message: "Authentication Failed - check again",
        };
      }
    } else {
      return {
        StatusCode: 500,
        Message: 'Secret is in binary format which is not handled',
      };
    }
  } catch (err) {
    console.error(err);
    return {
      StatusCode: 500,
      Message: 'Failed to retrieve secret or list buckets',
      Error: err.message,
    };
  }
};
