import EBSVolume from "../models/EBSVolume.js";
import combineInstanceandVolumeData from "../scripts/combineInstanceandVolumeData.js";

export const uploadVolumeData = async (req, res) => {
    try {
        const data = await combineInstanceandVolumeData(req.file.path);
        for (const volume of data) {
            await EBSVolume.create({ ...volume, userId: req.user.id });
        }
        res.status(200).json({ message: "Volume data uploaded successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};