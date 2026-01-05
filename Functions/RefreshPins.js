const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")
module.exports = async (client) => {
    const guild =  await client.guilds.fetch(config.guildId);
    const channel = await guild.channels.fetch(config.channels.mtc);
    const pins = await channel.messages.fetchPins(true);
    if (pins.size > 0){
        // for each pinned message...
        pins.forEach(async x=>{
            // fetch the full message
            const m = await channel.messages.fetch(x)
            // for each cached partial reaction
            await m.react('🔄')
            await x.reactions.cache.get('🔄').remove()
        })
    }
}
