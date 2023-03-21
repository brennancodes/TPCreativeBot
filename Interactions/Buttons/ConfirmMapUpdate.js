const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ConfirmMapUpdate"){ return false; }
        let msg = interaction.message;
        let idSplit = msg.embeds[0].data.description.split("Map ID: **");
        let mapId = idSplit[1].split("**")[0];
        let catSplit = msg.embeds[0].data.description.split("Category: **");
        let category = catSplit[1].split("**")[0];
        const catOptions = [
            {label:'Rotation',value:'Rotation---'+mapId},
            {label:'1.0',value:'1.0'},
            {label:'Trial',value:'Trial---'+mapId},
            {label:'0.5',value:'0.5'},
            {label:'Classic',value:'Classic---'+mapId},
            {label:'0.1',value:'0.1'},
            {label:'Retired',value:'Retired---'+mapId},
            {label:'0.0',value:'0'},
            {label:'Group',value:'Group---'+mapId}
        ];
        for (var i = 0; i < catOptions.length; i++){
            if (category == catOptions[i].label){
                catOptions.splice(i,1)
                break;
            }
        }
        const weightOptions = [];
        for (var i = 0; i < 11; i++){
            weightOptions.push({label:`${i/10}`,value:`${i/10}`})
        }
        const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setMinValues(2)
                    .setMaxValues(2)
                    .setCustomId('submitupdate')
                    .setPlaceholder('Select Category/Weight, then click outside.')
                    .addOptions(catOptions)                    
            )
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Cancel")
                    .setCustomId('cancelaction---update')
            )
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel('Send it!')
                    .setCustomId('LiterallyDoesNothingLmao')
            )
                    
        interaction.reply({content:"Select exactly one playlist and one weight.",ephemeral:true,components:[row,row2]})
        RemoveButtonsFromOriginal(interaction);
    }
    catch (err){
        console.log(err);
    }
}     