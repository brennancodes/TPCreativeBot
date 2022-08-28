const config = require("../config.json");

module.exports = async (client, interaction) => {
    let isValid = true;
    const currentDate = new Date()
    const msgSplit = interaction.message.embeds[0].description.split("ID: **")
    const msgSplit2 = msgSplit[1].split("**");
    const mapId = msgSplit2[0];
    const mtcChannel = client.channels.cache.get(config.channels.mtc);
    if (config.mtcSettings.awaitMTCAction) {
        const pins = await mtcChannel.messages.fetchPinned(true);
        pins.sort(function(a,b){
            return b.createdAt-a.createdAt;
        })
        pins.forEach(async x=>{
            if (x.content.includes(interaction.user.id) && x.content.includes("New map submission received") && isValid){
                if (((currentDate - x.createdAt)/3600000).toFixed(2) > config.mtcSettings.bypassAwaitHourThreshold){
                    if (config.mtcSettings.preventResubmit){
                        if (x.embeds[0]){
                            if (x.embeds[0].data){
                                const split1 = x.embeds[0].description.split("ID: **")
                                const split2 = split1[1].split("**");
                                if (split2[0] == mapId){
                                    isValid = false;
                                    await interaction.editReply({content:"This map has already been submitted.", ephemeral:true})
                                }
                            }
                        }
                    }
                }
                else if (isValid) {
                    isValid = false;
                    await interaction.editReply({content:"You still have a submission under review. Please try again later.", ephemeral:true})
                }
            }
        })
        if (isValid) {
            return true;
        }
    }
    else {
        await mtcChannel.messages.fetch({limit:100}).then(messages =>{
            messages.sort(function(a,b){
                return b.createdAt-a.createdAt;
            })
            messages.forEach(async x=>{
                if (x.content.includes(interaction.user.id) && x.content.includes("New map submission received") && isValid){
                    if (x.embeds[0]){
                        if (x.embeds[0].data.description){
                            const split1 = x.embeds[0].data.description.split("ID: **");
                            const split2 = split1[1].split("**")
                            if (split2[0] == mapId && config.mtcSettings.preventResubmit){
                                isValid = false;
                                await interaction.editReply({content:"This map has already been submitted.", ephemeral:true})
                            }
                            else if (((currentDate - x.createdAt)/3600000).toFixed(2) < config.mtcSettings.submitCooldownHours){
                                isValid = false;
                                await interaction.editReply({content: `You are submitting too frequently. Try again in ${(config.mtcSettings.submitCooldownHours*60) - ((currentDate - x.createdAt)/60000).toFixed(2)} minutes.`,ephemeral:true})
                            }
                        }
                    }
                }
            })
        })
        if (isValid){
            return true;
        }
    }
}