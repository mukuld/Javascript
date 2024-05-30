const fs = require('fs').promises;

async function extractInstanceData(inputFilePath, outputFilePath) {
    try {
        const data = await fs.readFile(inputFilePath, 'utf8');
        const jsonData = JSON.parse(data);
        const outputData = [];

        jsonData.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
                const instanceId = instance.InstanceId || 'N/A';
                const instanceType = instance.InstanceType || 'N/A';
                const volumeIds = instance.BlockDeviceMappings.map(blockDevice => blockDevice.Ebs?.VolumeId || 'N/A');
                const nameTag = instance.Tags.find(tag => tag.Key === "Name");
                const name = nameTag ? nameTag.Value : "N/A";

                outputData.push({
                    InstanceID: instanceId,
                    InstanceType: instanceType,
                    VolumeIDs: volumeIds,
                    Name: name
                });
            });
        });

        await fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');
        console.log(`Output written to ${outputFilePath}`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

const inputFilePath = './ec2-instances.json'; 
const outputFilePath = './extracted_instance_data2.json'; 
extractInstanceData(inputFilePath, outputFilePath);
