const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (interaction.customId != "ShareToChannel"){ return false; }
        const { embeds } = interaction.message;
        embeds[0].data.author.name = "Map Shared!"
        embeds[0].data.footer = {text:"What do you think? Smack some reaction emojis on me!"}
        const reply = await interaction.reply({
            content:`${interaction.user} shared a map.`,
            embeds: [embeds[0]],
            allowedMentions: {"users":[]},
            fetchReply: true
        });

        reply.react('👍');
        reply.react('👎');
        RemoveButtonsFromOriginal(interaction, true, "Map shared!")
    }
    catch (err){
        console.error(err)
    }
}