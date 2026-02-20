const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const { MessageFlags } = require("discord.js")

module.exports.execute = (interaction) => {
    if (!interaction.isButton()){ return false; }
    if (!interaction.customId.includes("cancelaction")){ return false; }
    RemoveButtonsFromOriginal(interaction, true);
    if (interaction.customId.includes("find") || interaction.customId.includes("summary")){
        interaction.update({content:"You're welcome!", flags:MessageFlags.Ephemeral})
    }
    else {
        interaction.update({content:"Action has been cancelled. Coward.", flags:MessageFlags.Ephemeral})
    }
}