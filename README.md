# TPCreativeBot

TPCreativeBot is a Discord bot built using Node.js and the discord.js library. The bot provides various tools and functionality related to the game TagPro to users within the official [TagPro Discord Server](https://discord.gg/tagpro-275851562172153856).

## Public SlashCommands
*These commands can be used by anyone.*
`/creativehelp`: List all commands available to the user.
`/findmap`: Search for a map currently in the Rotation, Trial, Classic, Retired, or Groups playlists.
`/findfortunatemap`: Search for a map on FortunateMaps.
`/submitmap`: Submit a map hosted on [FortunateMaps](https://fortunatemaps.subaverage.site) to the Map Test Committee. Submissions may be added to the base game.
`/getfeedback`: Review feedback from the MTC on a submitted map. You may want to use this input to refine your map and resubmit it.

## Private SlashCommands
*These commands are role-limited for MTC members only.*
`/rotationsummary`: View the current State of Rotation, including CTF/NF balance, weighted size, and average scores broken down by categories.
`/getcurrentrating`: Select a map that does not have a public score to view the true current score.
`/removemap`: Select a map in rotation to vote on its removal.
`/updatemap`: MTC Admins can use this method to change settings for existing maps in rotation.

<!-- 'ctrl' + 'k', then 'v' to open preview -->