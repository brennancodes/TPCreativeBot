const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")

module.exports = () => {    
    if (new Date(config.system.FMHostSwitchDate) >= new Date()){
        return "https://fortunatemaps.herokuapp.com/"
    }
    else {
        return "https://fortunatemaps.subaverage.site/"
    }
}