import { promises as fs } from 'fs';
import { PricingClient, GetProductsCommand } from '@aws-sdk/client-pricing';

// AWS Pricing client
const pricingClient = new PricingClient({ region: 'us-east-1' });

// Function to extract unique instance types and volume types
async function extractUniqueTypes(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  const instances = JSON.parse(data);
  
  const uniqueInstanceTypes = new Set();
  const uniqueVolumeTypes = new Set();

  instances.forEach(instance => {
    uniqueInstanceTypes.add(instance.InstanceType);
    instance.Volumes.forEach(volume => {
      uniqueVolumeTypes.add(volume.VolumeType);
    });
  });

  return {
    instanceTypes: Array.from(uniqueInstanceTypes),
    volumeTypes: Array.from(uniqueVolumeTypes)
  };
}

// Function to get pricing for each instance type from AWS
async function getInstancePricing(instanceTypes) {
  const instancePricing = {};

  for (const instanceType of instanceTypes) {
    const params = {
      ServiceCode: 'AmazonEC2',
      Filters: [
        {
          Type: 'TERM_MATCH',
          Field: 'instanceType',
          Value: instanceType,
        },
        {
          Type: 'TERM_MATCH',
          Field: 'location',
          Value: 'US East (N. Virginia)', // Adjust based on your needs
        },
      ],
    };

    const command = new GetProductsCommand(params);
    const response = await pricingClient.send(command);

    const priceList = JSON.parse(response.PriceList[0]);

    // Find the price per hour (On-Demand)
    const onDemandPricing = priceList.terms.OnDemand;
    const onDemandKey = Object.keys(onDemandPricing)[0];
    const priceDimensions = onDemandPricing[onDemandKey].priceDimensions;
    const priceDimensionKey = Object.keys(priceDimensions)[0];
    const pricePerHour = parseFloat(priceDimensions[priceDimensionKey].pricePerUnit.USD);

    instancePricing[instanceType] = pricePerHour;
  }

  return instancePricing;
}

// Function to get pricing for each volume type from AWS
async function getVolumePricing(volumeTypes) {
  const volumePricing = {};

  for (const volumeType of volumeTypes) {
    const params = {
      ServiceCode: 'AmazonEC2',
      Filters: [
        {
          Type: 'TERM_MATCH',
          Field: 'volumeType',
          Value: volumeType,
        },
        {
          Type: 'TERM_MATCH',
          Field: 'location',
          Value: 'US East (N. Virginia)', // Adjust based on your needs
        },
      ],
    };

    const command = new GetProductsCommand(params);
    const response = await pricingClient.send(command);

    const priceList = JSON.parse(response.PriceList[0]);

    // Extract volume pricing information
    const pricingDimensions = priceList.terms.OnDemand;
    const onDemandKey = Object.keys(pricingDimensions)[0];
    const priceDimensions = pricingDimensions[onDemandKey].priceDimensions;
    
    volumePricing[volumeType] = {
      perGB: parseFloat(priceDimensions['***'].pricePerUnit.USD),
      perIOPS: parseFloat(priceDimensions['***'].pricePerUnit.USD),
      perThroughput: parseFloat(priceDimensions['***'].pricePerUnit.USD)
    };
  }

  return volumePricing;
}

// Function to calculate monthly costs and generate output
async function calculateCosts(inputFilePath, outputFilePath) {
  try {
    const { instanceTypes, volumeTypes } = await extractUniqueTypes(inputFilePath);
    const instancePricing = await getInstancePricing(instanceTypes);
    const volumePricing = await getVolumePricing(volumeTypes);

    const data = await fs.readFile(inputFilePath, 'utf8');
    const instances = JSON.parse(data);

    const enrichedData = instances.map(instance => {
      const instanceCostPerHour = instancePricing[instance.InstanceType] || 0;
      const instanceCostPerMonth = instanceCostPerHour * 24 * 30; // Assuming 30 days in a month

      const volumes = instance.Volumes.map(volume => {
        const volumePricingDetails = volumePricing[volume.VolumeType] || {};
        const volumeCostPerMonth = (volumePricingDetails.perGB * volume.Size) + 
                                   (volumePricingDetails.perIOPS * volume.Iops) + 
                                   (volumePricingDetails.perThroughput * (volume.Throughput !== "N/A" ? volume.Throughput : 0));

        return {
          ...volume,
          MonthlyCost: volumeCostPerMonth
        };
      });

      const totalVolumeCostPerMonth = volumes.reduce((acc, vol) => acc + vol.MonthlyCost, 0);
      const totalCostPerMonth = instanceCostPerMonth + totalVolumeCostPerMonth;

      return {
        ...instance,
        InstanceMonthlyCost: instanceCostPerMonth,
        Volumes: volumes,
        TotalVolumeMonthlyCost: totalVolumeCostPerMonth,
        TotalMonthlyCost: totalCostPerMonth
      };
    });

    const combinedMonthlyCost = enrichedData.reduce((acc, instance) => acc + instance.TotalMonthlyCost, 0);

    const outputData = {
      enrichedData,
      combinedMonthlyCost
    };

    await fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2));
    console.log('Cost calculation complete.');
  } catch (error) {
    console.error('Error calculating costs:', error);
  }
}

calculateCosts('path/to/your/input.json', 'path/to/your/output.json');
