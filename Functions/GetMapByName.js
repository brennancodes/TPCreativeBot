const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")

module.exports = async (mapName, resultNumber = 1, isRemoval = false, isTrial = false) => {
    try {
        // const headers = {
        //     'tagpro2': `s%3ASJkgiV9lUYGZ7SczLrOfIs3Fjm4LI9Xn.Y0u03QDrEpVWlKRynnS49b2d%2BPfmsT7qKd1h4riwiBk`
        // }
        //, {headers: headers}
        const headers = {
            'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
        }
        const maps = await nfetch(`${config.urls.tagpro}/maps.json`, {headers: headers});
        const body = await maps.json();
        let counter = 0;
        for (const key in body){
            if (isRemoval && (key == "classic" || key == "retired" || key == "group" || key == "racing")){
                continue;
            }
            if (isTrial && (key == "classic" || key == "retired" || key == "group" || key == "rotation" || key == "racing")){
                continue;
            }
            for (const key2 in body[key]){
                let x = body[key][key2]
                if (x.name.toLowerCase().includes(mapName.toLowerCase())){
                    counter++;
                    if (counter == resultNumber){
                        var tmp = {
                            id: x._id,
                            name: x.name,
                            author: x.author,
                            score: x.score,
                            votes: x.totalUsers,
                            key: x.key,
                            weight: x.weight,
                            category: x.category.charAt(0).toUpperCase() + x.category.slice(1),
                            searchValue: mapName.toLowerCase()
                        }
                        return tmp;
                    }
                }
            }
        }
        return null;
    }
    catch (err){
        console.error(err);
    }
    
}