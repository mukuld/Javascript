const fs = require('fs').promises;

async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Error reading or parsing file from disk: ${error}`);
    }
}

async function writeJSONFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Output written to ${filePath}`);
    } catch (error) {
        throw new Error(`Error writing file to disk: ${error}`);
    }
}

async function combineInstanceAndVolumeData(instancesFilePath, volumesFilePath, outputFilePath) {
    try {
        const instancesData = await readJSONFile(instancesFilePath);
        const volumesData = await readJSONFile(volumesFilePath);

        const volumeMap = volumesData.Volumes.reduce((acc, volume) => {
            acc[volume.VolumeId] = {
                Size: volume.Size,
                VolumeType: volume.VolumeType,
                Iops: volume.Iops,
                Throughput: volume.VolumeType === 'gp3' ? volume.Throughput : 'N/A'
            };
            return acc;
        }, {});

        const combinedData = instancesData.map(instance => {
            const { InstanceID, InstanceType, VolumeIDs } = instance;
            const volumes = VolumeIDs.map(volumeId => {
                const volumeDetails = volumeMap[volumeId] || { Size: 'N/A', VolumeType: 'N/A', Iops: 'N/A', Throughput: 'N/A' };
                return { VolumeID: volumeId, ...volumeDetails };
            });

            return { InstanceID, InstanceType, Volumes: volumes };
        });

        await writeJSONFile(outputFilePath, combinedData);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

const instancesFilePath = './extracted_instance_data.json'; // Path to the instances output file
const volumesFilePath = './ec2-volumes.json'; // Path to the volumes file
const outputFilePath = './combined_instance_volume_data.json'; // Path to the output file
combineInstanceAndVolumeData(instancesFilePath, volumesFilePath, outputFilePath);
