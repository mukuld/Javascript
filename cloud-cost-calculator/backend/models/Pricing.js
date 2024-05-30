import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Pricing = sequelize.define("Pricing", {
    instanceType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pricePerHour: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    volumeType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pricePerGB: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    pricePerIOPS: {
        type: DataTypes.FLOAT,
    },
    pricePerThroughput: {
        type: DataTypes.FLOAT,
    },
});

export default Pricing;