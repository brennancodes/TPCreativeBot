const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const { RemoveButtonsFromOriginal, ValidateSubmission, CheckForExcessBlack } = require("../../Functions")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ConfirmMapSubmission"){ return false; }
        await interaction.deferReply({ephemeral:true});
        if (await ValidateSubmission(interaction.client,interaction)){
            let msg = interaction.message;
            let split = msg.embeds[0].data.description.split("ID: **");
            let split2 = split[1].split("**");
            let mapId = split2[0];
            const invalid = await CheckForExcessBlack(mapId);
            if (invalid != "Valid Submission"){
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Edit Map Border')
                        .setURL(`https://fortunatemaps.herokuapp.com/editor?mapid=${mapId}`),
                )
                interaction.editReply({content:`${invalid}\n*Don't forget to rewire any gates, portals, bombs, and buttons after resizing.*`,ephemeral:true,components:[row]});
            } else {
                interaction.editReply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
                const mtcChannel = interaction.client.channels.cache.get(config.channels.mtc);
                msg.content = `**ATTENTION <@&${config.roles.mtc}>:** New map submission [FM ID: \`${mapId}\`] received from <@${interaction.user.id}>.`
                msg.embeds[0].data.image = {url:msg.embeds[0].data.thumbnail.url};
                msg.embeds[0].data.author = {name:`Vote to add map to rotation on trial basis`,iconURL: msg.embeds[0].data.author.iconUrl}
                msg.embeds[0].data.footer = {text:`Please react ✅ to approve or ❌ to reject.`}
                delete msg.embeds[0].data.thumbnail;
                msg.components = [];
                msg.allowedMentions = {"users":[],"roles":[]};
                mtcChannel.send(msg).then(sent => {
                    sent.react("✅").then(()=>sent.react("❌")).then(()=>sent.react("🔬")).then(()=>sent.pin())
                    .then(()=>sent.startThread({name:`${mapId} Feedback - Visible to Mapmaker`,autoArchiveDuration:4320,reason:"Provide public feedback for the submission"}))                    
                })
                if (config.mtcSettings.useDiscussionChannel){
                    const discussionChannel = interaction.client.channels.cache.get(config.channels.mtcDiscussion);
                    discussionChannel.send(msg).then(sent => {
                        sent.startThread({name:`${mapId} Discussion - Private discussion, speak your mind`,autoArchiveDuration:4320,reason:"Private opportunity to discuss the submission"})
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