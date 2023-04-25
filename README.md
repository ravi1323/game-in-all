# Game In All

```typescript
import { Game } from 'gameinall';

try {
    const game = new Game({
        mProduction: false,
        httpPort: 3000,
        playersPerMatch: 2,
        matchDuration: 5 * 60 * 1000,
        minimumPlayersToPlay: 2,
        entryFees: []
    });
} catch(e) {
    console.log(e.message);
}
```
