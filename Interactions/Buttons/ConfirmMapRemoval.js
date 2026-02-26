const { GetMapById, RemoveButtonsFromOriginal } = require("../../Functions")
const {EmbedBuilder,MessageFlags} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("ConfirmMapRemoval")){ return false; }
        else {
            await interaction.deferReply({flags:MessageFlags.Ephemeral})
            const mtcChannel = interaction.client.channels.cache.get(config.channels.mtc);
            const map = await GetMapById(interaction.customId.split("---")[1]);
            if (map.score == 0){
                const headers = {
                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
                }
                const url = `${config.urls.api}/getmap/${map.id}`                
                await axios({method:'get',url:url,headers:headers}).then(function(resp){
                    if (resp.data && parseFloat(resp.data.score) != NaN){
                        console.info("Successful request. Response: ", resp.data)
                        map.score = resp.data.score;
                        map.votes = resp.data.totalUsers;
                    }
                });
            }
            const imgUrl = `${config.urls.image}/${map.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`

            const embed = new EmbedBuilder()
            .setImage(imgUrl)
            .setColor("#da3e52")
            .setAuthor({name:`Vote to remove map from rotation`,iconURL:"https://yt3.ggpht.com/ytc/AKedOLR7zLQoUR66-HRRuQltkh8fGyrIENcSkRrDQWTw=s900-c-k-c0x00ffffff-no-rj"})
            .setDescription(`**${map.name} by ${map.author}**\nCurrent Score: **${map.score}%** (${map.votes} votes)\nMap ID: ${map.id}`)
            // .setDescription("**"+interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].label+"**\n"
            //     + interaction.message.components[0].components[0].data.options.filter(x=>x.value==interaction.values[0])[0].description)
            .setFooter({text:`Please react ✅ to remove or ❌ to keep.`})

            const msg = {
                content:`**ATTENTION <@&${config.roles.mtc}>:** New map removal nomination received from <@${interaction.user.id}>.`,
                embeds:[embed],
                allowedMentions:{"users":[],"roles":[]}
            }


            interaction.editReply({content:"Removal vote posted in MTC channel!",flags:MessageFlags.Ephemeral})
            try {
                const sent = await mtcChannel.send(msg);
            
                await sent.react("✅");
                await sent.react("❌");
                await sent.pin();
            
                await sent.startThread({
                    name: `${map.name} Removal Discussion`,
                    autoArchiveDuration: 4320,
                    reason: "Private opportunity to discuss removal"
                });
            
                const sentMessageUrl = sent.url;
            
                if (config.mtcSettings.useDiscussionChannel) {
                    const discussionChannel = interaction.client.channels.cache.get(config.channels.mtcDiscussion);
            
                    await discussionChannel.send({
                        content: `**ATTENTION <@&${config.roles.mtc}>:** ${map.name} by ${map.author} has been nominated for 🦀 **removal** 🦀 by <@${interaction.user.id}>.\n${sentMessageUrl}`,
                        allowedMentions: { "users": [], "roles": [] }
                    });
                }
            
            } catch (err) {
                console.error("Error during removal reaction/thread creation:", err);
            }
            RemoveButtonsFromOriginal(interaction);

        }
    }
    catch (err) {
        console.error(err)
    }
}