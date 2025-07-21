const axios = require('axios');
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json");

// Function to get map data including selection stats from the MTC API
module.exports = async (mapId) => {
    const headers = {
        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
    };

    const url = `${config.urls.api}/getmap/${mapId}`;

    try {
        const response = await axios({
            method: 'get',
            url: url,
            headers: headers,
        });

        if (response.data && response.data._id) {
            return {
                id: response.data._id,
                name: response.data.name,
                author: response.data.author,
                score: response.data.score || 0,
                votes: response.data.totalUsers || 0,
                key: response.data.key,
                weight: response.data.weight,
                category: response.data.category.charAt(0).toUpperCase() + response.data.category.slice(1),
                timesPresented: response.data.timesPresented,
                timesSelected: response.data.timesSelected,
                selectionRate: response.data.selectionRate,
                headToHeadStats: response.data.headToHeadStats,
                inRankedRotation: response.data.inRankedRotation,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching map with stats:", error.message);
        return null;
    }
};