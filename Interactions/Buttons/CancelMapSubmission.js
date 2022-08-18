const config = require("../../config.json");
const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports = (client) => {
    client.on("interactionCreate", interaction => {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "CancelMapSubmission"){ return false; }
        interaction.reply({content:"Submission has been cancelled. Nothing sent to MTC.", ephemeral:true})
        // This is needed to remove the components (buttons)            
        removeButtonsFromOriginal(interaction);
    })
}