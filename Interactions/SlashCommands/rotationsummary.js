const { MessageFlags } = require("discord.js");
const CalculateRotationBalance = require("../../Functions/CalculateRotationBalance");

module.exports.execute = async (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "rotationsummary"){
        return false;
    }
    await interaction.deferReply({flags:MessageFlags.Ephemeral});
    CalculateRotationBalance(interaction.client, interaction)
}