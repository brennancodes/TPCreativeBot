const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = (interaction) => {
    if (!interaction.isButton()){ return false; }
    if (!interaction.customId.includes("CancelMapSubmission")){ return false; }
    var code = interaction.customId.split("---")[1]
    interaction.update({content:`Submission of map \`${code}\` has been cancelled. Nothing sent to MTC.`, ephemeral:true})
    // This is needed to remove the components (buttons) and embed.
    RemoveButtonsFromOriginal(interaction,true);
}