const config = require("../../config.json");
const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const ValidateSubmission = require("../../Functions/ValidateSubmission")

module.exports = (client) => {
    client.on("interactionCreate", async interaction => {
        try {
            if (!interaction.isButton()){ return false; }
            if (interaction.customId != "ConfirmMapSubmission"){ return false; }
            await interaction.deferReply({ephemeral:true});
            if (await ValidateSubmission(client,interaction)){
                interaction.editReply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
                const mtcChannel = client.channels.cache.get(config.channels.mtc);
                let msg = interaction.message;
                let split = msg.embeds[0].data.description.split("ID: **");
                let split2 = split[1].split("**");
                let mapId = split2[0];
                msg.content = `**ATTENTION <@&${config.roles.mtc}>:** New map submission received from <@${interaction.user.id}>.`
                msg.embeds[0].data.image = {url:msg.embeds[0].data.thumbnail.url};
                msg.embeds[0].data.author = {name:`Vote to add map to rotation on trial basis`,iconURL: msg.embeds[0].data.author.iconUrl}
                msg.embeds[0].data.footer = {text:`Please react ✅ to approve or ❌ to reject.`}
                delete msg.embeds[0].data.thumbnail;
                msg.components = [];
                msg.allowedMentions = {"users":[],"roles":[]};
                mtcChannel.send(msg).then(sent => {
                    sent.react("✅").then(()=>sent.react("❌")).then(()=>sent.react("🔬")).then(()=>sent.pin())
                    .then(()=>sent.startThread({name:`${mapId} Feedback`,autoArchiveDuration:4320,reason:"Provide public feedback for the submission"}))                    
                })
                if (config.mtcSettings.useDiscussionChannel){
                    const discussionChannel = client.channels.cache.get(config.channels.mtcDiscussion);
                    discussionChannel.send(msg).then(sent=>{
                        sent.startThread({name:`${mapId} Discussion`,autoArchiveDuration:4320,reason:"Private opportunity to discuss the submission"})
                    })
                }
            }
            // This is needed to remove the components (buttons)            
            removeButtonsFromOriginal(interaction);
        }
        catch (err){
            console.log(err);
        }
    })
}     