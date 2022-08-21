const config = require("../../config.json");
const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const ValidateSubmission = require("../../Functions/ValidateSubmission")

module.exports = (client) => {
    client.on("interactionCreate", async interaction => {
        try {
            if (!interaction.isButton()){ return false; }
            if (interaction.customId != "ConfirmMapSubmission"){ return false; }
            await interaction.deferReply();
            if (await ValidateSubmission(client,interaction)){
                interaction.editReply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
                const mtcChannel = client.channels.cache.get(config.channels.mtc);
                let msg = interaction.message;
                msg.content = `**ATTENTION <@&${config.roles.mtc}>:** New submission received from <@${interaction.user.id}>. \nPlease react ✅ to approve or ❌ to reject.`
                msg.embeds[0].data.image = {url:msg.embeds[0].data.thumbnail.url};
                msg.embeds[0].data.author = {name:`Vote to add map to rotation on trial basis`,iconURL: msg.embeds[0].data.author.iconUrl}
                delete msg.embeds[0].data.thumbnail;
                msg.components = [];
                msg.allowedMentions = {"users":[],"roles":[]};
                mtcChannel.send(msg).then(sent => {
                    sent.react("✅").then(()=>sent.react("❌")).then(()=>sent.react("🔬")).then(()=>sent.pin())
                })
            }
            // This is needed to remove the components (buttons)            
            removeButtonsFromOriginal(interaction);
        }
        catch (err){
            console.log(err);
        }
    })
}     