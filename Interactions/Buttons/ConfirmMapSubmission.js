const config = require("../../config.json");
const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports = (client) => {
    client.on("interactionCreate", interaction => {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ConfirmMapSubmission"){ return false; }
        interaction.reply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
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
        // This is needed to remove the components (buttons)            
        removeButtonsFromOriginal(interaction);
    })
}     