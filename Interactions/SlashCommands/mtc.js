const {EmbedBuilder} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "mtc"){
            return false;
        }

        const mtcUsers = guild.roles.cache.get(config.roles.mtc).members.map(m=>m.user.id)
    }
    catch (err) {
        console.log(err)
    }
}