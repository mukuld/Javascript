const fs = require('fs').promises;

async function calculateCosts() {
    try {
        const combinedData = await fs.readFile('combined_instance_volume_data.json', 'utf8');
        const data = JSON.parse(combinedData);

        const instanceCosts = {
            't2.large': 0.0928,
            'c5a.xlarge': 0.096,
            't3.2xlarge': 0.3328,
            't3.xlarge': 0.1664,
            'c5.2xlarge': 0.34,
            'c5.xlarge': 0.17,
            't2.micro': 0.0116
        };

        const volumeCosts = {
            'gp2': { perGB: 0.10, perIOPS: 0.065 },
            'gp3': { perGB: 0.08, perIOPS: 0.005, perThroughput: 0.04 },
            'io2': { perGB: 0.125, perIOPS: 0.065 }
        };

        let totalMonthlyCost = 0;

        const enrichedData = data.map(instance => {
            const instanceCostPerHour = instanceCosts[instance.InstanceType] || 0;
            const instanceMonthlyCost = instanceCostPerHour * 730; // Assuming 730 hours per month

            const volumes = instance.Volumes.map(volume => {
                const { VolumeType, Size, Iops, Throughput } = volume;
                const volumePricing = volumeCosts[VolumeType] || {};
                const sizeCost = (volumePricing.perGB || 0) * Size * 30; // Assuming 30 days in a month
                const iopsCost = (volumePricing.perIOPS || 0) * (Iops || 0) * 730; // Assuming 730 hours per month
                const throughputCost = (volumePricing.perThroughput || 0) * (Throughput !== "N/A" ? Throughput : 0) * 730; // Assuming 730 hours per month
                const totalVolumeCost = sizeCost + iopsCost + throughputCost;
                return {
                    ...volume,
                    TotalVolumeCost: totalVolumeCost
                };
            });

            const totalVolumeMonthlyCost = volumes.reduce((acc, vol) => acc + vol.TotalVolumeCost, 0);
            const totalInstanceMonthlyCost = instanceMonthlyCost + totalVolumeMonthlyCost;
            totalMonthlyCost += totalInstanceMonthlyCost;

            return {
                ...instance,
                InstanceMonthlyCost: instanceMonthlyCost,
                Volumes: volumes,
                TotalVolumeMonthlyCost: totalVolumeMonthlyCost,
                TotalInstanceMonthlyCost: totalInstanceMonthlyCost
            };
        });

        await fs.writeFile('final_monthly_costs.json', JSON.stringify(enrichedData, null, 2));
        console.log('Monthly cost calculation complete.');
        console.log('Overall monthly cost for all instances and volumes:', totalMonthlyCost);
    } catch (error) {
        console.error('Error calculating monthly costs:', error);
    }
}

calculateCosts();
