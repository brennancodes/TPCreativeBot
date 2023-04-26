const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 

module.exports = async (mapName, resultNumber = 1, isRemoval = false) => {
    try {
        const maps = await nfetch('https://tagpro.koalabeast.com/maps.json')
        const body = await maps.json();
        let counter = 0;
        for (const key in body){
            if (isRemoval && (key == "classic" || key == "retired" || key == "group")){
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
                            score: x.averageRating,
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