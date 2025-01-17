# f

Natural Language to runnable functions

```JavaScript
import { create } from "@paulkinlan/f";
import { prompt, ChromePromptConfiguration } from "@paulkinlan/reactive-prompt/chrome"

// Create the builder - we have to tell it which reactive prompt we want to use.
const f = create(
  prompt, ChromePromptConfiguration
);

const sum = await f`Sum two numbers`
console.log(sum.toString());  // See the code that is produced
console.log(sum(22,44)) // Run the code.
```

## Installation

```bash
npm install @paulkinlan/f
```
