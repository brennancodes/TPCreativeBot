const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")

//Returns an array of all maps
module.exports = async () => {
    const headers = {
        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
    }
    const maps = await nfetch(`${config.urls.tagpro}/maps.json`, {headers:headers})
    const body = await maps.json();
    const mapList = []
    for (const key in body){
        for (const key2 in body[key]){
            let x = body[key][key2]
                var tmp = {
                    id: x._id,
                    name: x.name,
                    author: x.author,
                    score: x.score,
                    key: x.key,
                    weight: x.weight,
                    category: x.category.charAt(0).toUpperCase() + x.category.slice(1)
                }
                mapList.push(tmp);
        }
    }
    return mapList;
}