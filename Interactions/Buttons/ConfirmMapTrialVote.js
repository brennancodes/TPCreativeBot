const { GetMapById, RemoveButtonsFromOriginal } = require("../../Functions")
const {EmbedBuilder} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("ConfirmMapTrialVote")){ return false; }
        else {
            const mtcChannel = interaction.client.channels.cache.get(config.channels.mtc);
            const map = await GetMapById(interaction.customId.split("---")[1]);

            const imgUrl = `${config.urls.image}/${map.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            
            const embed = new EmbedBuilder()
            .setImage(imgUrl)
            .setColor("#da3e52")
            .setAuthor({name:`Vote to add or remove trial map`,iconURL:"https://yt3.ggpht.com/ytc/AKedOLR7zLQoUR66-HRRuQltkh8fGyrIENcSkRrDQWTw=s900-c-k-c0x00ffffff-no-rj"})
            .setDescription(`**${map.name} by ${map.author}**\nCurrent Score: ${map.score}\nMap ID: ${map.id}`)
            // .setDescription("**"+interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].label+"**\n"
            //     + interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].description)
            .setFooter({text:`Please react ✅ to add or ⏳ to wait for now.`})
            
            const msg = {
                content:`**ATTENTION <@&${config.roles.mtc}>:** New Trial Map Vote called by <@${interaction.user.id}>.`,
                embeds:[embed],
                allowedMentions:{"users":[],"roles":[]}
            }
            
            if (config.mtcSettings.useDiscussionChannel){
                const discussionChannel = interaction.client.channels.cache.get(config.channels.mtcDiscussion);
                discussionChannel.send(msg).then(sent=>{
                    sent.startThread({name:`${map.name} Trial Vote Discussion`,autoArchiveDuration:4320,reason:"Private opportunity to discuss addition or removal"})
                })
            }

            interaction.reply({content:"Removal vote posted in MTC channel!",ephemeral:true})
            mtcChannel.send(msg).then(sent => {sent.react("✅").then(()=>{sent.react("⏳")}).then(()=>sent.pin())})
            RemoveButtonsFromOriginal(interaction);
        }
    }
    catch (err) {
        console.error(err)
    }
}