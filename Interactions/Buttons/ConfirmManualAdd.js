const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const { RemoveButtonsFromOriginal, ValidateSubmission, CheckForExcessBlack, GetFMRoot } = require("../../Functions")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const axios = require('axios');

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ConfirmManualAdd"){ return false; }
        await interaction.deferReply({flags:MessageFlags.Ephemeral});
        if (await ValidateSubmission(interaction.client,interaction)){
            let msg = interaction.message;
            let mapName = msg.embeds[0].data.description.split("**")[1];
            let split = msg.embeds[0].data.description.split("ID: **");
            let split2 = split[1].split("**");
            let mapId = split2[0];
            const invalid = await CheckForExcessBlack(mapId);
            if (invalid != "Valid Submission"){
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Edit Map Border')
                    .setURL(`${GetFMRoot()}editor?mapid=${mapId}`),
                )
                interaction.editReply({content:`${invalid}\n*Don't forget to rewire any gates, portals, bombs, and buttons after resizing.*`,flags:MessageFlags.Ephemeral,components:[row]});
            } else {
                const description = interaction.message.embeds[0].data.description;
                const descSplit = description.split('**');                
                const channel = interaction.client.channels.cache.get(config.channels.mtc);
                const mtcAdminChannel = interaction.client.channels.cache.get(config.channels.mtcAdmin);
                const mtcAnnouncementChannel = interaction.client.channels.cache.get(config.channels.mtcAnnouncements);
                const rootUrl = GetFMRoot();
                const mapByAuthorLinks = `[**${descSplit[1]}**](${rootUrl}map/${descSplit[3]}) by [**${descSplit[5]}**](${rootUrl}profile/${descSplit[5].replaceAll(" ","_")})`
                const mapByAuthor = `${descSplit[3]}: *${descSplit[1]}* by ${descSplit[5]}`;
                const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96';

                const headers = {
                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                }
                const url = `${config.urls.api}/addmap/${descSplit[3]}`
                await axios({method:'post',url:url,headers:headers}).then(function(resp){
                    try {
                        if (resp.data && resp.data.includes("Inserted")){
                            interaction.editReply({content:"Got it! Map added to Trial Rotation.", flags:MessageFlags.Ephemeral})
                            //const imageUrl = `${interaction.message.embeds[0].data.image.url}`
                            const imageUrl = `${interaction.message.embeds[0].data.thumbnail.url}`
                            const embed = new EmbedBuilder().setColor('#7bcf5c')
                                .setAuthor({name:"Added to Trial Rotation",iconURL:iconUrl})
                                .setDescription(`${mapByAuthorLinks}\n\nID: **${descSplit[3]}**`)
                                .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`).setTimestamp()
                            console.info("Successful request. Response: ", resp.data)
                            mtcAdminChannel.send({embeds:[embed],content:`**MANUALLY ADDED TO ROTATION BY ADMINISTRATOR <@${interaction.user.id}>** \n${mapByAuthor}`,allowedMentions: {"users":[]}});
                            channel.send({embeds:[embed],content:`**MANUALLY ADDED TO ROTATION BY ADMINISTRATOR <@${interaction.user.id}>** \n${mapByAuthor}`,allowedMentions: {"users":[]}});
                            embed.setDescription(`${mapByAuthorLinks}\nID: **${descSplit[3]}**`);
                            embed.setThumbnail(null);
                            embed.setImage(imageUrl)
                            mtcAnnouncementChannel.send({embeds:[embed],content:`<@&${config.roles.mapUpdates}> **Added to Trial Rotation**\n${mapByAuthor}`})
                        }
                        else {
                            console.error("Request failed.")
                            mtcAdminChannel.send({content:`**Potential API error.** URL:${url}\n Please investigate ${mapByAuthor}`})
                        }
                    }
                    catch (err) {
                        mtcAdminChannel.send({content: "RemoveMap API Error. Check logs."})
                        console.error(err);
                    }
                })
            }
        }
        // This is needed to remove the components (buttons)            
        RemoveButtonsFromOriginal(interaction);
    }
    catch (err){
        console.error(err);
    }
}     