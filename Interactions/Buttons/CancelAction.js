const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = (interaction) => {
    if (!interaction.isButton()){ return false; }
    if (!interaction.customId.includes("cancelaction")){ return false; }
    removeButtonsFromOriginal(interaction, true);
    if (interaction.customId.includes("find")){
        interaction.update({content:"You're welcome!", ephemeral:true})
    }
    else {
        interaction.update({content:"Action has been cancelled. Knew you wouldn't, pussy.", ephemeral:true})
    }
}