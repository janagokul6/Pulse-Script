import { config } from './config/index.js';
import app from './app.js';

app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
