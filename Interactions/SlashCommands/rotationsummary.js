const CalculateRotationBalance = require("../../Functions/CalculateRotationBalance");

module.exports = (client) => {
    client.on('interactionCreate', interaction => {    
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "rotationsummary"){
            return false;
        }
        CalculateRotationBalance(client, interaction)
    })
}