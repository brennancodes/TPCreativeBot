const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const {EmbedBuilder} = require("discord.js")
const config = require("../../config.json")

module.exports = (client) => {
    client.on("interactionCreate", async interaction => {
        try {
            if (!interaction.isSelectMenu()){ return false; }
            if (interaction.customId != "removerotationmap"){ return; }
            if (interaction.values[0] === "Cancel"){
                interaction.reply({content:"Action cancelled. Coward.",ephemeral:true})
                removeButtonsFromOriginal(interaction);
            }
            else {
                const mtcChannel = client.channels.cache.get(config.channels.mtc);
                const imgUrl = `https://static.koalabeast.com/images/maps/${interaction.values[0].replaceAll("_","%20").replaceAll(" ","%20")}-small.png`
                
                const embed = new EmbedBuilder()
                .setImage(imgUrl)
                .setColor("#da3e52")
                .setAuthor({name:`Vote to remove map from rotation`})
                .setDescription("**"+interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].label+"**\n"
                    + interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].description)
                .setFooter({text:`Please react ✅ to remove or ❌ to keep.`})
                
                const msg = {
                    content:`**ATTENTION <@&${config.roles.mtc}>:** New map removal nomination received from <@${interaction.user.id}>.`,
                    embeds:[embed],
                    allowedMentions:{"users":[],"roles":[]}
                }
                
                if (config.mtcSettings.useDiscussionChannel){
                    const discussionChannel = client.channels.cache.get(config.channels.mtcDiscussion);
                    discussionChannel.send(msg).then(sent=>{
                        sent.startThread({name:`${interaction.values[0].replaceAll("_"," ")} Removal Discussion`,autoArchiveDuration:4320,reason:"Private opportunity to discuss removal"})
                    })
                }

                interaction.reply({content:"Get Pinged Nerd!",ephemeral:true})
                mtcChannel.send(msg).then(sent => {sent.react("✅").then(()=>sent.react("❌")).then(()=>sent.pin())})
                removeButtonsFromOriginal(interaction);
            }
        }
        catch (err) {
            console.log(err)
        }
    })
}