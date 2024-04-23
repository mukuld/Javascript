# Process AWS Monitron data

### Introduction:

AWS Monitron provides local sensors via IOT devices to capture vital statistics of the machines to predict failures. That will allow the maintenance crew to get ahead and fix issues before letting any events turn into expensive incidents and downtimes.

### The script

The data is collected by the gateways and is then sent to AWS using Kinesis Data Streams and Amazon Firehose and finally it is stored in S3 bucket. The scripts pulls the data from the S3 bucket. It applies transformation to the data to convert it into a format that is expected by the downstream system, cleans it and sends it to the destination API.

The script runs in AWS Lambda and all the dependencies (node_modules) are packaged in a different layer so that updating th code is easier. All the critical information is passed to the script via variables which can be secured further by using AWS Secrets Manager. But that is for later.

Once the data is sent to the destination, the script moves the existing records to a new bucket so that when the data comes in next day, a fresh set of records is send and data is not duplicated. The script is invoked by using S3 triggers. Whenver the Firehose sends data to S3, the script is invoked and data is processed automatically.

### Tools

The script uses basic node.js functions and AWS SDK for Javascript v3. The script also uses Axios to POST the data to the API. I considered using the native Fetch but Axios is simpler and more powerful.

### Conclusion:

The script in itself is pretty simple. Feedback and forks are welcome.