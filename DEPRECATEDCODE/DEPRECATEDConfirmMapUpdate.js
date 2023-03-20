const { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const removeButtonsFromOriginal = require("../Functions/RemoveButtonsFromOriginal")

module.exports = (client) => {
    client.on("interactionCreate", async interaction => {
        try {
            if (!interaction.isButton()){ return false; }
            if (interaction.customId != "ConfirmMapUpdate"){ return false; }
            let msg = interaction.message;
            let idSplit = msg.embeds[0].data.description.split("Map ID: **");
            let mapId = idSplit[1].split("**")[0];
            let catSplit = msg.embeds[0].data.description.split("Category: **");
            let category = catSplit[1].split("**")[0];
            const catOptions = [
                {label:'Rotation',value:'Rotation---'+mapId,description:'Standard Weight: 1'},
                {label:'Trial',value:'Trial---'+mapId,description:'Standard Weight: 0.5'},
                {label:'Classic',value:'Classic---'+mapId,description:'Standard Weight: 0.5'},
                {label:'Retired',value:'Retired---'+mapId,description:'Standard Weight: 0'},
                {label:'Group',value:'Group---'+mapId,description:'Standard Weight: 0'},
                {label:'Cancel',value:'Cancel',description:'Nevermind!'}
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
                        .setCustomId('updatecategory')
                        .setPlaceholder('Select New Category')
                        .addOptions(catOptions)                    
                )
            // interaction.reply({content:"Got it! Map sent to MTC for review.", ephemeral:true})
            // let msg = interaction.message;
            // let split = msg.embeds[0].data.description.split("ID: **");
            // let split2 = split[1].split("**");
            // let mapId = split2[0];
            // msg.content = `**ATTENTION <@&${config.roles.mtc}>:** New map submission received from <@${interaction.user.id}>.`
            // msg.embeds[0].data.image = {url:msg.embeds[0].data.thumbnail.url};
            // msg.embeds[0].data.author = {name:`Vote to add map to rotation on trial basis`,iconURL: msg.embeds[0].data.author.iconUrl}
            // msg.embeds[0].data.footer = {text:`Please react ✅ to approve or ❌ to reject.`}
            // delete msg.embeds[0].data.thumbnail;
            // msg.components = [];
            // msg.allowedMentions = {"users":[],"roles":[]};
            
            // This is needed to remove the components (buttons)            
            //removeButtonsFromOriginal(interaction);

            interaction.reply({content:"Do what with it?",ephemeral:true,components:[row]})
            removeButtonsFromOriginal(interaction);
        }
        catch (err){
            console.log(err);
        }
    })
}     