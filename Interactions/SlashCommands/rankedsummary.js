const { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { GetRotationMapsWithStats } = require("../../Functions");

module.exports.execute = async (interaction) => {
    if (!interaction.isChatInputCommand() || !interaction.commandName.includes("rankedsummary")) {
        return false;
    }

    await interaction.deferReply({ flags:MessageFlags.Ephemeral });

    const maps = await GetRotationMapsWithStats();

    if (!maps || maps.length === 0) {
        await interaction.editReply({
            content: "Could not fetch ranked rotation maps or no maps found.",
        });
        return;
    }

    // Sort maps by selection rate descending
    maps.sort((a, b) => b.selectionRate - a.selectionRate);

    let description = '**Ranked Rotation - Selection Rates**\n```Rk. Name           Score  Votes\n';
    
    maps.forEach((map, index) => {
        const rank = String(index + 1).padStart(2, ' ');
        const name = map.name.substring(0, 13).padEnd(13, ' ');
        const rate = (map.selectionRate * 100).toFixed(1).padStart(5, ' ');
        const times = String(map.timesPresented || 0);
        description += `${rank}. ${name} ${rate}% (${times.padStart(3, ' ')}x)\n`;
    });

    description += '```';

    const avgSelectionRate = maps.reduce((sum, map) => sum + map.selectionRate, 0) / maps.length;
    const totalPresentations = maps.reduce((sum, map) => sum + (map.timesPresented || 0), 0);
    const totalSelections = maps.reduce((sum, map) => sum + (map.timesSelected || 0), 0);

    description += `\n\n**Stats Summary:**`;
    description += `\nAverage Selection Rate: **${(avgSelectionRate * 100).toFixed(1)}%**`;
    description += `\nTotal Presentations: **${totalPresentations.toLocaleString()}**`;
    description += `\nTotal Selections: **${totalSelections.toLocaleString()}**`;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ShareToChannel---ksummary').setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
        new ButtonBuilder().setCustomId('cancelaction---summary').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
    )

    const embed = new EmbedBuilder()
        .setColor('#186360')
        .setTitle('Ranked Rotation Map Selection Statistics')
        .setDescription(description)
        .setFooter({ text: `Total ranked maps: ${maps.length} | Data from MTC API` })
        .setTimestamp();

    await interaction.editReply({ 
        embeds: [embed],
        components: [row],
        flags:MessageFlags.Ephemeral
    });
};