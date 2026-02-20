const {MessageFlags} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "mtc"){
            return false;
        }
        await interaction.deferReply({flags:MessageFlags.Ephemeral})

        const guild =  await interaction.client.guilds.fetch(config.guildId);
        await guild.members.fetch();
        const mtcUsers = guild.roles.cache.get(config.roles.mtc).members.map(m => { if (!m.user.bot) { return m.user.id }})
        var contentString = "Current MTC:\n"
        mtcUsers.forEach(x => { if (x != undefined) {contentString+=`<@${x}>\n`}})
        interaction.editReply({content:contentString,flags:MessageFlags.Ephemeral,allowedMentions: {"users":[]}})
    }
    catch (err) {
        console.log(err)
    }
}