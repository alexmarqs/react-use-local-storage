# @alexmarqs/react-use-local-storage

[![npm version](https://badge.fury.io/js/%40alexmarqs%2Freact-use-local-storage.svg)](https://badge.fury.io/js/%40alexmarqs%2Freact-use-local-storage)
[![Minified size](https://badgen.net/bundlephobia/min/@alexmarqs/react-use-local-storage)](https://bundlephobia.com/package/@alexmarqs/react-use-local-storage)
[![codecov](https://codecov.io/gh/alexmarqs/react-use-local-storage/branch/main/graph/badge.svg?token=31EXDKJZIO)](https://codecov.io/gh/alexmarqs/react-use-local-storage)
[![Actions Status](https://github.com/alexmarqs/react-use-local-storage/workflows/CI/badge.svg)](https://github.com/alexmarqs/react-use-local-storage/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> React hook to persist and sync state with localStorage. Typescript + SSR supported.

## 🔨 Install

With NPM

```shell
npm install @alexmarqs/react-use-local-storage
```

With Yarn

```shell
yarn add @alexmarqs/react-use-local-storage
```

## 🚀 Features

- Typescript support
- SSR support
- 100% test coverage
- Syncronization support to track changes across browser tabs (Window storage event subscription) - available via additional option (check API or Usage section)
- Non string values support (`JSON.parse()` and `JSON.stringify()` are used to decode/encode information from/to localStorage)
- Bad usage detection (for example, an error will be generated if multiple hook instances are detected)
- [Functional updates](https://reactjs.org/docs/hooks-reference.html#functional-updates) are supported (similar to React `useState`)
- No dependencies!

## 📄 API

### useLocalStorage(key, defaultValue, options?)

| Argument     | Type                                                                            | Required?                                                | Description                                            |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| key          | `string`                                                                        | Yes                                                      | The local storage key                                  |
| defaultValue | `any` (with typescript you can explicity pass the type as `useLocalStorage<T>`) | Yes                                                      | The initial value of the data                          |
| options      | `{ sync: boolean }`                                                             | No. The default value for the **sync** option is `false` | **sync**: enables synchronization between broswer tabs |

## 🎮 Usage

> If you are not using Typescript please ignore the types.

```tsx
import useLocalStorage from '@alexmarqs/react-use-local-storage';
// Named export alternative: import { useLocalStorage } from '@alexmarqs/react-use-local-storage';

// Scenario 1
const [todos, setTodos] = useLocalStorage('todos', ['Todo 1', 'Todo 2']);

// Scenario 2
type UserConsent = {
  analytics: boolean;
  marketing: boolean;
};
const [userConsent, setUserConsent] = useLocalStorage<UserConsent>('user-consent', {
  analytics: false,
  marketing: false,
});

// Scenario 3 (enable sync between browser tabs)
const [todos, setTodos] = useLocalStorage<string[]>('todos', [], { sync: true });
```

### Example 1

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import useLocalStorage from '@alexmarqs/react-use-local-storage';

const App = () => {
  const [value, setValue] = useLocalStorage('your-key', 'your-initial-value');

  return (
    <div className="App">
      <h1>Set value to store in Local Storage</h1>
      <div>
        <label>
          Value:{' '}
          <input
            type="text"
            placeholder="Enter value"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
```

### Example 2 (using with React Context API)

```tsx
import React, { createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import useLocalStorage from '@alexmarqs/react-use-local-storage';

// This code can be extracted to a TodosContext file

type Todos = string[];
type TodosContextData = [Todos, React.Dispatch<React.SetStateAction<Todos>>];

const TodosContext = createContext([[], () => {}] as TodosContextData);

export const TodosProvider = ({ children }) => {
  const ctxTodos = useLocalStorage<Todos>('todos', [], { sync: true });
  return <TodosContext.Provider value={ctxTodos}>{children}</TodosContext.Provider>;
};

export const useTodos = () => {
  const context = useContext(TodosContext);
  if (context === undefined) {
    throw new Error('useTodos can only be used inside TodosProvider');
  }
  return context;
};

// App entry point (index)

const App = () => {
  const [todos, setTodos] = useTodos();

  return (
    <div className="App">
      <h1>Todos</h1>
      {todos.length === 0
        ? 'No todos in the local storage'
        : `You have ${todos.length} todos in the local storage`}
      {/**
       * Do something more, example: Add new todos
       */}
    </div>
  );
};

ReactDOM.render(
  <TodosProvider>
    <App />
  </TodosProvider>,
  document.getElementById('root')
);
```

## License

MIT License © [alexmarqs](https://github.com/alexmarqs)
