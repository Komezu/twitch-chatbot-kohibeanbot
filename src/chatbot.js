import { Client } from 'tmi.js';
import axios from 'axios';
import { COMMANDS, COLORS } from './constants.js';

const allCommands = COMMANDS.join(', ');

export default class Chatbot extends Client {
  constructor(OPTIONS) {
    super(OPTIONS);
    // Store method call to each command
    this.commandMethods = {
      '!bot': this.bot,
      '!commands': this.commands,
      '!game': this.game,
      '!help': this.help,
      '!randomnum': this.randomNum,
      '!recolorbot': this.recolorBot
    };
    // Store chatters' message count in a channel for a bot session
    this.messageCount = {};
    OPTIONS.channels.forEach((channel) => {
      // Initialize channel owner's count to 0 to avoid triggering first message sound alert
      this.messageCount[channel] = { [channel.substring(1)]: 0 };
    })
  }

  tallyAndFlagFirst(channel, username) {
    let first = false;
    if (!(username in this.messageCount[channel])) {
      first = true;
      this.messageCount[channel][username] = 1;
    } else {
      this.messageCount[channel][username]++;
    }
    // Return whether it was user's first message on channel for this session
    return first;
  }

  runCommand(channel, message) {
    // Retrieve and execute method call if valid command
    if (message in this.commandMethods) this.commandMethods[message](channel);
  }

  // Command methods
  // Note: need to use arrow functions to avoid changing scope of 'this'

  bot = (channel) => {
    this.action(channel, '(bot in training) is here!');
  }

  commands = (channel) => {
    this.say(channel, `Available commands are: ${allCommands}`);
  }

  game = (channel) => {
    const url = `https://api.twitch.tv/helix/streams?type=live&user_login=${channel.substring(1)}`
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.OAUTH_TOKEN}`,
        'Client-Id': process.env.CLIENT_ID
      }
    })
      .then((response) => {
        const gameName = response.data.data[0].game_name;
        this.say(channel, `Currently playing: ${gameName}`);
      })
      .catch(() => this.action(channel, `could not get info on the game.`));
  }

  help = (channel) => {
    this.say(channel, `Available commands are: ${allCommands}`);
  }

  randomNum = (channel) => {
    this.say(channel, `Number generated: ${Math.floor(Math.random() * 100) + 1}`);
  }

  recolorBot = (channel) => {
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    this.color(color)
      .then(response => this.action(channel, `was recolored to ${response}!`))
      .catch(() => this.action(channel, `was not recolored successfully.`));
  }
}
