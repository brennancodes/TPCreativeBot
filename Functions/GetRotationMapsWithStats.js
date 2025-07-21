const axios = require('axios');
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json");

// Function to get all ranked rotation maps with selection stats from the MTC API
module.exports = async () => {
    const headers = {
        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
    };

    const url = `${config.urls.api}/rankedmaps`;

    try {
        const response = await axios({
            method: 'get',
            url: url,
            headers: headers,
        });

        if (response.data && Array.isArray(response.data)) {
            return response.data.map(map => ({
                name: map.name,
                author: map.author,
                score: map.score || 0,
                votes: map.totalUsers || 0,
                timesPresented: map.timesPresented || 0,
                timesSelected: map.timesSelected || 0,
                selectionRate: map.selectionRate || 0,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching ranked maps with stats:", error.message);
        return [];
    }
};