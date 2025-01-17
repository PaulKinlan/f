import { signal, effect } from "@preact/signals-core";

function isSignal(obj) {
  return (
    obj != undefined &&
    typeof obj != "string" &&
    "brand" in obj &&
    typeof obj.brand === "symbol" &&
    Symbol.keyFor(obj.brand) === "preact-signals"
  );
}

function accumulate(strings, values) {
  const returnSignal = signal();
  effect(() => {
    const result = [strings[0]];
    for (let valueIdx = 0; valueIdx < values.length; valueIdx++) {
      let value = values[valueIdx];
      if (isSignal(value)) {
        // This dereference sets up the notification dependency
        value = value.value;
      }
      // TODO: if value is a promise we need to work out how to resolve it as we add it.
      result.push(value, strings[valueIdx + 1]);
    }

    returnSignal.value = result.join("");
  });

  return returnSignal;
}

const create = (prompt, config) => {
  return (strings, ...values) => {
    const promptSignal = accumulate(strings, values);
    const genFunc = prompt`${config} You are an expert JavaScript developer. 
      
You MUST always follow these rules:
+ Return a single function.
+ Constants in the prompt must be used in the function
+ NEVER assume structure of data unless provided in the prompt.
+ NEVER assume any constants without them being explicitly provided in the prompt.
+ NEVER assume an API key is required unless the prompt includes it.
+ Your target platform is the Web Browser.
+ You can use any browser APIs.
+ NEVER try to mutate state outside of the function.
+ When the user asks for a UI the developer create a root element and return that to the user
+ ALWAYS implement all the logic. NEVER leave anything to be implemented later
+ ALWAYS use modern JS features (ES6+), e.g fetch etc.
+ NEVER use async/await, generate code that uses .then() chaining.
+ NEVER include comments.
+ NEVER include explanations.
+ NEVER use a library e.g. React, Lodash, etc.
+ NEVER "require()" any libraries.
+ NEVER use TypeScript. 
+ NEVER use NodeJS APIs. 
+ NEVER use Deno specific APIs. 
+ NEVER use arrow or lambda syntax for functions
+ NEVER assign the function to a variable.

EXAMPLE:
+ PASS: "Uppercase a string" = function uppercase(a) { return a.toUpperCase(); }
+ FAIL: "Uppercase a string" = const uppercase = (a) => a.toUpperCase();
+ FAIL: "Uppercase a string" = function uppercase(a) { return a.toUpperCase(); } You can call this function by calling uppercase("hello")
+ FAIL: "Uppercase a string" = function uppercase(a) { return a.toUpperCase(); } uppercase("hello")

Create a valid JavaScript function to solve the following problem: ${promptSignal}`;

    const parseJS = (js) => {
      const codeExtractRegExp = /```(\n|js|JavaScript\n)(.*?)```/ims;
      const results = codeExtractRegExp.exec(js);
      if (results && results.length > 0) {
        return results[2].replace(/^\nfunction/, "function");
      } else if (js.startsWith("\nfunction") || js.startsWith("function")) {
        return js;
      }

      return;
    };

    function stripTypesFromFunctionDeclaration(tsFunctionString) {
      // Remove interface or type definitions (if any) before processing the function
      tsFunctionString = tsFunctionString.replace(
        /^(interface|type)\s+\w+\s*\{[\s\S]*?^\}/gm,
        ""
      );

      // Regular expression to match a function declaration, including arrow functions
      const functionRegex =
        /(?:async\s+)?function\s*\w*\s*(\([\s\S]*?\))\s*(:\s*[\w\s<>[\]|]+)?|const\s+\w+\s*=\s*(?:async\s+)?(\([\s\S]*?\))\s*=>/g;

      // Extract the parameters and function body
      const match = functionRegex.exec(tsFunctionString);
      if (!match) {
        return tsFunctionString; // Return as is if not a function declaration
      }

      const paramsString = match[1] || match[3]; // Parameter string (group 1 or 3 from regex)

      // Remove type annotations from parameters
      const strippedParamsString = paramsString.replace(
        /:\s*[\w\s<>[\]|]+(=\s*[\w\s\(\)]+)?/g,
        ""
      );

      // Replace the original parameters with the stripped parameters
      let jsFunctionString = tsFunctionString.replace(
        paramsString,
        strippedParamsString
      );

      // Remove return type annotation (if any)
      jsFunctionString = jsFunctionString.replace(
        /(\))\s*:\s*[\w\s<>[\]|]+/,
        "$1"
      );

      return jsFunctionString;
    }

    return new Promise((resolve, reject) => {
      effect(() => {
        const functionScript = genFunc.value;
        if (functionScript === undefined) {
          return;
        }

        try {
          const js = stripTypesFromFunctionDeclaration(
            parseJS(functionScript.trim())
          );

          if (js) {
            const func = eval(`(() => { 
            "use strict"; 
            return ${js}; 
          })()`);
            resolve(func);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  };
};

export { create };
