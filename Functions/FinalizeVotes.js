const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")
const cron = require("cron")

module.exports = async (client) => {
    let job = new cron.CronJob(config.mtcSettings.finalizeDateTime, checkForCompletedVotes)
    job.start();

    async function checkForCompletedVotes(){ 
        const guild =  await client.guilds.fetch(config.guildId);
        const channel = await guild.channels.cache.get(config.channels.mtc);
        const pins = await channel.messages.fetchPins(true);
        if (pins){
            console.log("Checking pins for completed votes...")
            pins.forEach(async p => {
                p.fetch(p.id).then((m) => {
                    let y = m.reactions.cache.get('✅')?.count;
                    let n = m.reactions.cache.get('❌')?.count;
                    let w = m.reactions.cache.get('⏳')?.count;

                    //let mapId = m.content.split("`")[1];

                    let c = Math.round(new Date(m.createdTimestamp).getTime() / 1000)
                    var now = Math.round(new Date().getTime() / 1000);
                    var mvtAgo = now - (config.mtcSettings.minimumVoteTime * 3600);
    
                    // if the vote was called > X hours ago
                    // trust me this is what it means
                    if (c < mvtAgo){
                        // Checks promo nomination "wait" reacts against "yes" reacts
                        if (w > y && w >= config.mtcSettings.approveDenyThreshold){
                            m.reactions.cache.get('⏳').users.remove(config.users.bot)
                            m.react('⏳');
                        }
                        // Checks all nomination "yes" reacts against "no" reacts
                        else if (y > n && y >= config.mtcSettings.approveDenyThreshold){
                            m.reactions.cache.get('✅').users.remove(config.users.bot)
                            m.react('✅');
                        }
                        // Checks all non-promo nomination "no" reacts against "yes" reacts
                        else if (n > y && n >= config.mtcSettings.approveDenyThreshold){
                            m.reactions.cache.get('❌').users.remove(config.users.bot)
                            m.react('❌');
                        }
                    }
                    //console.log(y, n, w)
                })
            })
        }
    }
}