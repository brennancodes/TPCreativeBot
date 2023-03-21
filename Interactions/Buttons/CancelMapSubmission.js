const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = (interaction) => {
    if (!interaction.isButton()){ return false; }
    if (interaction.customId != "CancelMapSubmission"){ return false; }
    interaction.reply({content:"Submission has been cancelled. Nothing sent to MTC.", ephemeral:true})
    // This is needed to remove the components (buttons)            
    RemoveButtonsFromOriginal(interaction);
}