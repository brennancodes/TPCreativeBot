const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const { MessageFlags } = require("discord.js")

module.exports.execute = (interaction) => {
    if (!interaction.isButton()){ return false; }
    if (!interaction.customId.includes("CancelMapSubmission")){ return false; }
    var code = interaction.customId.split("---")[1]
    interaction.update({content:`Submission of map \`${code}\` has been cancelled. Nothing sent to MTC.`, flags:MessageFlags.Ephemeral})
    // This is needed to remove the components (buttons) and embed.
    RemoveButtonsFromOriginal(interaction,true);
}