const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 

//Returns an array of all maps
module.exports = async () => {
    const maps = await nfetch('https://tagpro.koalabeast.com/maps.json')
    const body = await maps.json();
    const mapList = []
    for (const key in body){
        for (const key2 in body[key]){
            let x = body[key][key2]
                var tmp = {
                    id: x._id,
                    name: x.name,
                    author: x.author,
                    score: x.averageRating,
                    key: x.key,
                    weight: x.weight,
                    category: x.category.charAt(0).toUpperCase() + x.category.slice(1)
                }
                mapList.push(tmp);
        }
    }
    return mapList;
}