const removeButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const {EmbedBuilder} = require("discord.js")

module.exports = () => {
    if (!interaction.isSelectMenu()){ return false; }
    if (interaction.customId != "removerotationmap"){ return; }
    if (interaction.values[0] === "Cancel"){
        interaction.reply({content:"Action cancelled. Knew you wouldn't, pussy.",ephemeral:true})
        removeButtonsFromOriginal(interaction);
    }
    else {
        const imgUrl = `https://static.koalabeast.com/images/maps/${interaction.values[0].replaceAll("_","%20").replaceAll(" ","%20")}-small.png`
        console.log(imgUrl)
        const embed = new EmbedBuilder()
            .setImage(imgUrl)
        interaction.reply({content:`**ATTENTION <@&${config.roles.mtc}>:** New removal nomination received from <@${interaction.user.id}>. \nPlease react ✅ to remove or ❌ to keep.`,embeds:[embed]})
        removeButtonsFromOriginal(interaction);
    }
}