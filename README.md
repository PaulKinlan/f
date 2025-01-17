# f

Natural Language to runnable functions.

```JavaScript
import { create } from "@paulkinlan/f";
import { prompt, ChromePromptConfiguration } from "@paulkinlan/reactive-prompt/chrome"

// Create the builder - we have to tell it which reactive prompt we want to use.
const config = new ChromePromptConfiguration();
const f = create(
  prompt, config
);

// Create a function that sums two numbers
const sum = await f`Sum two numbers`;

console.log(sum(22,44)) // Run the code.
```

## Using Claude (or other LLMs)

[reactive-prompts](https://github.com/paulkinlan/reactive-prompts) offers the developer to use the following LLMs:

- Gemini - `import { prompt, GeminiPromptConfiguration } from "@paulkinlan/reactive-prompt/gemini`
- Gemini Nano in Chrome - `import { prompt, ChromePromptConfiguration } from "@paulkinlan/reactive-prompt/chrome`
- Claude - `import { prompt, ClaudePromptConfiguration } from "@paulkinlan/reactive-prompt/claude`
- OpenAI - `import { prompt, OpenAIPromptConfiguration } from "@paulkinlan/reactive-prompt/openai`
- Ollama - `import { prompt, OllamaPromptConfiguration } from "@paulkinlan/reactive-prompt/ollama`

You can pass in the exported `prompt` and configuration objects in to `create` and `f` will use these libraries as the LLM exectution engine.

## Recompiling the function

Because the prompting library is based on [reactive-prompts](https://github.com/paulkinlan/reactive-prompts) it is possible to recompile the function when the prompt uses a signal to change the prompt.

```JavaScript
import { create } from "@paulkinlan/f";
import { prompt, ChromePromptConfiguration } from "@paulkinlan/reactive-prompt/chrome";
import { signal, effect } from "@preact/signals";

const f = create(
  prompt, new ChromePromptConfiguration()
);

const numbers = signal(2);

// Prompts can take a signal as an argument which means the prompt can re-run.
const sum = await f`Sum ${numbers} numbers`;

// The first generated function is the direct invocation of the code generated by the prompt. While it can update, you won't know if it did.
console.log("Direct invocation", sum(22,44));

// Update the signal which will re-generate the function.
setTimeout(() => {
  numbers.value = 3;
}, 2000);

// Watch for changes.
effect(()=>{
  // Each function has a signal that you can watch.
  const func = sum.signal.value;
  // You can either call sum directly, or you can do it via the signal.
  if (func) {
    if (func.length === 2) {
      console.log(func(22, 44));
    } else if (func.length === 3) {
      console.log(func(1,2, 3));
    }
  }
})
```

## Installation

```bash
npm install @paulkinlan/f
```
