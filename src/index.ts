import { Game } from './services/game.service';

process.on('uncaughtException', function (err) {
    console.log(err.message);
});

export const Greet = () => 'Hello world!';
export { Game };
