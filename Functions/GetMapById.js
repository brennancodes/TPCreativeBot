const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")

module.exports = async (mapId) => {
    const headers = {
        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
    }
    const maps = await nfetch(`${config.urls.tagpro}/maps.json`, {headers:headers})
    const body = await maps.json();
    for (const key in body){
        for (const key2 in body[key]){
            let x = body[key][key2]
            if (x._id.includes(mapId)){
                var tmp = {
                    id: x._id,
                    name: x.name,
                    author: x.author,
                    score: x.score,
                    key: x.key,
                    weight: x.weight,
                    category: x.category.charAt(0).toUpperCase() + x.category.slice(1),
                    searchValue: mapId
                }
                return tmp;
            }
        }
    }                    
}