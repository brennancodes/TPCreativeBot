const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports = (client) => {
    client.on("interactionCreate", interaction => {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("cancelaction")){ return false; }
        removeButtonsFromOriginal(interaction, true);
        if (interaction.customId.includes("find")){
            interaction.update({content:"You're welcome!", ephemeral:true})
        }
        else {
            interaction.update({content:"Action has been cancelled. Knew you wouldn't, pussy.", ephemeral:true})
        }
        // This is needed to remove the components (buttons)            
    })
}