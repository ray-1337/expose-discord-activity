# Expose Discord Activity
Expose user Discord presence/activities through your bot. (*May require Guild Members/Presences Intents*)

## About the Repo
This is a D.I.Y (Do It Yourself) repo.
Modify this repo to anything you want.
You can use it for REST APIs, like... literally any.

## Why?
There was a repo called [lanyard](https://github.com/Phineas/lanyard) which you can expose your Discord activities but I'm not a pro of Elixir.
Also, I don't want to join their server just for exposing your own activities.
So I'll just remake it on Node.js instead, and release it to the public.
This was supposed to be a personal use, for example my personal website.

## Journey
It took me an hour to understand their [docs](https://discord.com/developers/docs/topics/gateway).
And everything here was based on their docs. So, please read their docs before doing anything.

## Specs
- [Node.js, v16.x](https://nodejs.org)
- [NPM, v8.1.x](https://npmjs.org)

## Starting Point
- Type `npm install` or `npm i` in your console.
- Go to your `.env` file and replace the value of `SECRET=` with your **bot token.**
- Then, go to your `config.js` file and replace the value of `userMonitoredID` with your **account ID.**
- Type `node .` or `node main.js` to start the evaluation.

## License
https://opensource.org/licenses/MIT