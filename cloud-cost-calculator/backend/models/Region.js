import { DataTypes } from "sequelize";
import sequelize from "../config/database";

const Region = sequelize.define("Region",{
    regionName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

export default Region;