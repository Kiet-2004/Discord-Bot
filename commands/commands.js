const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Reply with a "Hello!"'),
	async execute(interaction) {
		await interaction.reply(`Hello ${interaction.user}`);
	},
};