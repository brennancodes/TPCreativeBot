const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")

module.exports = async (mapId) => {
    const maps = await nfetch(`${config.urls.tagpro}/maps.json`)
    const body = await maps.json();
    for (const key in body){
        for (const key2 in body[key]){
            let x = body[key][key2]
            if (x._id.includes(mapId)){
                var tmp = {
                    id: x._id,
                    name: x.name,
                    author: x.author,
                    score: x.averageRating,
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