const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const { RemoveButtonsFromOriginal, ValidateSubmission, CheckForExcessBlack, GetFMRoot } = require("../../Functions")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ConfirmMapSubmission"){ return false; }
        await interaction.deferReply({ephemeral:true});
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
                interaction.editReply({content:`${invalid}\n*Don't forget to rewire any gates, portals, bombs, and buttons after resizing.*`,ephemeral:true,components:[row]});
            } else {
                const isUpdate = await msg.embeds[0].data.author.name.includes("update submission");
                const mapImage = msg.embeds[0].data.thumbnail.url;
                const desc = msg.embeds[0].data.description;
                let color = isUpdate ? '#D850F7' : '#7bcf5c'
                let submissionType = isUpdate ? 'UPDATED map submission' : 'New map submission'
                interaction.editReply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
                const mtcChannel = interaction.client.channels.cache.get(config.channels.mtc);

                const newEmbed = new EmbedBuilder()
                                    .setColor(color)
                                    .setImage(mapImage)
                                    //.setAuthor({name:`Vote to add map to rotation on trial basis`,iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`})
                                    .setDescription(desc)
                                    .setFooter({text:`Please react ✅ to approve or ❌ to reject.`})
                let newContent = `**ATTENTION <@&${config.roles.mtc}>:** ${submissionType} [FM ID: \`${mapId}\`] received from <@${interaction.user.id}>.`
                if (isUpdate) { newContent += `\nAdvancing this map will overwrite the PNG and JSON files of the existing map with this name in the game. It will not overwrite votes.` }

                mtcChannel.send({content:newContent,embeds:[newEmbed],allowedMentions:{users:[],roles:[]}}).then(sent => {
                    sent.react("✅").then(()=>sent.react("❌")).then(()=>sent.react("🔬")).then(()=>sent.pin())
                    .then(()=>sent.startThread({name:`${mapName} ${mapId} Feedback - Visible to Mapmaker`,autoArchiveDuration:4320,reason:"Provide public feedback for the submission"}))
                })
                if (config.mtcSettings.useDiscussionChannel){
                    const discussionChannel = interaction.client.channels.cache.get(config.channels.mtcDiscussion);

                    const discEmbed = new EmbedBuilder()
                                        .setColor(color)
                                        .setThumbnail(mapImage)
                                        .setDescription(desc)

                    // msg.embeds[0].data.thumbnail = msg.embeds[0].data.image;
                    // delete msg.embeds[0].data.image;
                    // delete msg.embeds[0].data.footer;
                    // delete msg.embeds[0].data.author;
                    discussionChannel.send({content:newContent,embeds:[discEmbed],components:[],allowedMentions:{users:[],roles:[]}}).then(sent => {
                        sent.startThread({name:`${mapName} ${mapId} Discussion - Private discussion, speak your mind`,autoArchiveDuration:4320,reason:"Private opportunity to discuss the submission"})
                    })
                }
            }
        }
        // This is needed to remove the components (buttons)
        RemoveButtonsFromOriginal(interaction);
    }
    catch (err){
        console.error(err);
    }
}