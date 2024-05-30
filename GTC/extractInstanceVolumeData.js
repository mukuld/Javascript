const fs = require('fs').promises;

async function extractInstanceVolumeData() {
    try {
        const instancesData = await fs.readFile('ec2-instances.json', 'utf8');
        const volumesData = await fs.readFile('ec2-volumes.json', 'utf8');
        
        const instances = JSON.parse(instancesData).Reservations.flatMap(res => res.Instances.map(instance => {
            const nameTag = instance.Tags.find(tag => tag.Key === 'Name');
            return {
                InstanceID: instance.InstanceId,
                InstanceType: instance.InstanceType,
                InstanceName: nameTag ? nameTag.Value : 'N/A',
                Volumes: instance.BlockDeviceMappings.map(mapping => mapping.Ebs.VolumeId)
            };
        }));

        const volumes = JSON.parse(volumesData).Volumes.reduce((acc, volume) => {
            acc[volume.VolumeId] = {
                VolumeID: volume.VolumeId,
                Size: volume.Size,
                VolumeType: volume.VolumeType,
                Iops: volume.Iops,
                Throughput: volume.VolumeType === 'gp3' ? volume.Throughput : "N/A"
            };
            return acc;
        }, {});

        instances.forEach(instance => {
            instance.Volumes = instance.Volumes.map(volumeId => volumes[volumeId]);
        });

        await fs.writeFile('combined_instance_volume_data.json', JSON.stringify(instances, null, 2));
        console.log('Data extraction complete.');
    } catch (error) {
        console.error('Error extracting data:', error);
    }
}

extractInstanceVolumeData();
