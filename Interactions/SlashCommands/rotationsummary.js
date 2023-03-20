const CalculateRotationBalance = require("../../Functions/CalculateRotationBalance");

module.exports.execute = (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "rotationsummary"){
        return false;
    }
    CalculateRotationBalance(interaction.client, interaction)
}