const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js")
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
            {label:'Casual Rotation',value:'Rotation---'+mapId+'---inCasualRotation'},
            {label:'Ranked Rotation',value:'Rotation---'+mapId+'---inRankedRotation'},
            {label:'1.0',value:'1.0'},
            {label:'Trial',value:'Trial---'+mapId},
            {label:'0.75',value:'0.75'},
            {label:'Classic',value:'Classic---'+mapId},
            {label:'0.5',value:'0.5'},
            {label:'Retired',value:'Retired---'+mapId},
            {label:'0.1',value:'0.1'},
            {label:'Group',value:'Group---'+mapId},
            {label:'0.0',value:'0'}
        ];

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('submitupdate')
                    .setPlaceholder('Select Category/Weight, then click outside.')
                    .setMinValues(2)
                    .setMaxValues(2)
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
                    
        interaction.update({content:"Select exactly one playlist and one weight.",flags:MessageFlags.Ephemeral,components:[row,row2]})
    }
    catch (err){
        console.error(err);
    }
}