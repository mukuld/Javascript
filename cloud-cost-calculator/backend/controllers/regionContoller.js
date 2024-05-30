import Region from "../models/Region.js";

export const getRegions = async (req, res) => {
    try {
        const regions = await Region.findAll();
        res.json(regions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};