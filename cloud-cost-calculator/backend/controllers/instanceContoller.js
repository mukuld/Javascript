import EC2Instnace from "../models/EC2Instance.js";
import extractInstanceData from "../scripts/extractInstanceData.js";

export const uploadInstanceData = async (req, res) => {
    try {
        const data = await extractInstanceData(req.filt.path);
        for (const instance of data) {
            await EC2Instnace.create({ ...instance, userId: req.user.id });
        }
        res.status(200).json({ message: "Instance data uploaded successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};