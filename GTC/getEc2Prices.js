import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

// Set the region for the Pricing API
const region = 'us-east-1';

// Create a PricingClient
const pricingClient = new PricingClient({ region });

// Function to fetch instance prices
async function getInstancePrices() {
    try {
        // Parameters for EC2 pricing
        const params = {
            ServiceCode: 'AmazonEC2',
            MaxResults: 100 // Adjust as needed
        };

        // Fetch EC2 pricing
        const data = await pricingClient.send(new GetProductsCommand(params));
        // Process data
        // Example: extract instance types and prices from data
        const instancePrices = data.PriceList.map(product => {
            const instanceType = product.product.attributes.instanceType;
            const price = parseFloat(product.terms.OnDemand[Object.keys(product.terms.OnDemand)[0]].priceDimensions[Object.keys(product.terms.OnDemand[Object.keys(product.terms.OnDemand)[0]].priceDimensions)[0]].pricePerUnit.USD);
            return { instanceType, price };
        });

        console.log('Instance Prices:', instancePrices);
    } catch (error) {
        console.error('Error fetching instance prices:', error);
    }
}

// Function to fetch volume prices
async function getVolumePrices() {
    try {
        // Parameters for EBS pricing
        const params = {
            ServiceCode: 'AmazonEC2',
            Filters: [
                {
                    Field: 'volumeType',
                    Type: 'TERM_MATCH',
                    Value: 'EBS General Purpose'
                }
            ],
            MaxResults: 100 // Adjust as needed
        };

        // Fetch EBS pricing
        const data = await pricingClient.send(new GetProductsCommand(params));
        // Process data
        // Example: extract volume types and prices from data
        const volumePrices = data.PriceList.map(product => {
            const volumeType = product.product.attributes.volumeType;
            const price = parseFloat(product.terms.OnDemand[Object.keys(product.terms.OnDemand)[0]].priceDimensions[Object.keys(product.terms.OnDemand[Object.keys(product.terms.OnDemand)[0]].priceDimensions)[0]].pricePerUnit.USD);
            return { volumeType, price };
        });

        console.log('Volume Prices:', volumePrices);
    } catch (error) {
        console.error('Error fetching volume prices:', error);
    }
}

// Call the functions to fetch prices
getInstancePrices();
getVolumePrices();