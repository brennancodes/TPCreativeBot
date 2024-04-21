const GetAllMaps = require("./GetAllMaps");

module.exports = async (mapName) => {
    try {
        const maps = await GetAllMaps();
        let exists = false;
        for (var i = 0; i < maps.length; i++){
            if (maps[i].name === mapName){
                exists = true;
            }
        }
        return exists;
    }

    catch (err){
        console.error(err);
    }
}