import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const EBSVolume = sequelize.define("EBSVolume", {
    volumeId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    volumeType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    iops: {
        type: DataTypes.INTEGER,
    },
    throughput: {
        type: DataTypes.INTEGER,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

export default EBSVolume;