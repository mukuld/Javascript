import calculateCosts from "../scripts/calculateCosts.js";

export const calculateCosts = async (req, res) => {
    try {
        const costs = calculateCosts(req.body);
        res.status(200).json(costs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};