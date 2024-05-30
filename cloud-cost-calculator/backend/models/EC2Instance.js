import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const EC2Instance = sequelize.define("EC2Instance", {
    instanceId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    instanceType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

export default EC2Instance;