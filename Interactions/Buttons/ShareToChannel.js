const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("ShareToChannel")){ return false; }
        // TO DO: Use a switch statement instead of repeating yourself 100 times
        const { embeds } = interaction.message;
        if (interaction.customId.includes("tsummary")){
            interaction.channel.send({
                content:`${interaction.user} shared the trial rotation summary.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Summary shared!")
        }
        else if (interaction.customId.includes("thsummary")){
            interaction.channel.send({
                content:`${interaction.user} shared the throwback rotation summary.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Summary shared!")
        }
        else if (interaction.customId.includes("csummary")){
            interaction.channel.send({
                content:`${interaction.user} shared the casual rotation summary.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Summary shared!")
        }
        else if (interaction.customId.includes("ksummary")){
            interaction.channel.send({
                content:`${interaction.user} shared the ranked rotation summary.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Summary shared!")
        }
        else if (interaction.customId.includes("rsummary")){
            interaction.channel.send({
                content:`${interaction.user} shared the rotation summary.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Summary shared!")
        }        
        else if (interaction.customId.includes("rminfo")){
            interaction.channel.send({
                content:`${interaction.user} shared some ranked map data.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });
            interaction.update({content:"Content shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Ranked map info shared!")
        }
        else {
            // embeds[0].data.author.name = "Map Shared!"
            embeds[0].data.footer = {text:"What do you think? Smack some reaction emojis on me!"}
            const reply = await interaction.channel.send({
                content:`${interaction.user} shared a map.`,
                embeds: [embeds[0]],
                allowedMentions: {"users":[]},
                fetchReply: true
            });

            reply.react('👍');
            reply.react('👎');
            interaction.update({content:"Map shared!"})
            RemoveButtonsFromOriginal(interaction, true, "Map shared!")
        }
    }
    catch (err){
        console.error(err)
    }
}
