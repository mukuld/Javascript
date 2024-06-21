import React, { useEffect, useState, userState } from 'react';
import axios from 'axios';

const RegionDropdown = ({ onchange }) => {
    const [regions, setRegions] = useState([]);

    useEffect(() => {
        const fetchRegions = async () => {
            const response = await axios.get("/api/regions");
            setRegions(response.data);
        };
        fetchRegions();
    }, []);

    return (
        <select onChange={(e) => onchange(e.target.value)}>
            <option value="">Select a region</option>
            {regions.map(region => (
                <option key={region.regionName} value={region.regionName}>
                    {region.regionName}
                </option>
            ))}
        </select>
    );
};

export default RegionDropdown;