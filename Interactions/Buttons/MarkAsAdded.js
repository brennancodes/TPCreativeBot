const config = require("../../config.json");
const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports = (client) => {
    client.on("interactionCreate", interaction => {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "MarkAsAdded"){ return false; }
        interaction.message.unpin();
        interaction.reply({content:`Content has been added to the game by <@${interaction.user.id}>`, allowedMentions:{"users":[]}})
        // This is needed to remove the components (buttons)            
        removeButtonsFromOriginal(interaction);
    })
}