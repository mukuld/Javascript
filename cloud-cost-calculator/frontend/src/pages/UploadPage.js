import React, { useState } from 'react';
import axios from 'axios';
import RegionDropdown from '../components/RegionDropdown';

const UploadPage = () => {
    const [region, setRegion] = useState("");
    const [instancesFile, setInstancesFile] = useState(null);
    const [volumesFile, setVolumesFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append("region", region);
        formData.append("instancesFile", instancesFile);
        formData.append("volumesFile", volumesFile);

        const response = await axios.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setResult(response.data);
    };

  return (
    <div>
        <h1>Upload EC2 Instances and EBS Volumes</h1>
        <RegionDropdown onChange={setRegion} />
        <input type='file' onChange={(e) => setInstancesFile(e.target.files[0])} />
        <input type='file' onChange={(e) => setVolumesFile(e.target.files[0])} />
        <button onClick={handleUpload}>Upload</button>
        {result && (
            <div>
                <h2>Cost Calculation Result</h2>
                <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
        )}
    </div>
  );
};

export default UploadPage;