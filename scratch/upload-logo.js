const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4ODY4OTRiYS02NjU1LTRhNzItYTIyMC1lODVmZWVlZWM1ODgiLCJlbWFpbCI6Im5pY2t0aGVsZWdlbmQ2OTY5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiY2U0NDRlNWEwZTk3YmJiM2JmOSIsInNjb3BlZEtleVNlY3JldCI6IjVhMGU4MTQ4NTAyZjE5ZjRkYzlmYTc0OTJhMWIzNGE3M2RmYzY3MmM0NGQ1YTRkYjFkYzVmZmRiNmUzNzczNDAiLCJleHAiOjE4MDc2ODA1Njh9.cTiChfClefJsFNS6St29NBJNkJI9zuoBglVgCWmPbxA';
const filePath = 'd:\\Project\\irion\\irion-core\\public\\logo.png';

async function uploadFile() {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    let data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    const metadata = JSON.stringify({
        name: 'irion-logo.png',
    });
    data.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    })
    data.append('pinataOptions', options);

    try {
        const res = await axios.post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'Authorization': `Bearer ${JWT}`
            }
        });
        console.log('Upload successful!');
        console.log('CID:', res.data.IpfsHash);
        console.log('URL: ipfs://' + res.data.IpfsHash);
    } catch (error) {
        console.error('Upload failed!');
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

uploadFile();
