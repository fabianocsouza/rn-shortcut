<!--
*** Thank you to see this README.
*** If you have a suggestion that can improve it,
*** fork and create a Pull Request or open an Issue with a "suggestion" tag.
*** Thank you a lot!
-->

<h1 align="center">
  <img alt="React Native Shortcut" width="90%" title="React Native Shortcut" src="./assets/header.png" />
</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=fabianocs.rn-shortcut"><img alt="VS Marketplace installs" src="https://img.shields.io/visual-studio-marketplace/i/fabianocs.rn-shortcut?label=installs"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=fabianocs.rn-shortcut"><img alt="VS Marketplace version" src="https://img.shields.io/visual-studio-marketplace/v/fabianocs.rn-shortcut"></a>
  <a href="https://open-vsx.org/extension/fabianocs/rn-shortcut"><img alt="Open VSX" src="https://img.shields.io/open-vsx/v/fabianocs/rn-shortcut?label=open%20vsx"></a>
</p>

</br>

<p align="center">
  <img alt="rn-ctx and rn-fl snippets in action" width="100%" src=".github/demo.gif" />
</p>

<p align="center">
  <img alt="Component snippets: rn, rn-s, rn-sc, rn-styled, rn-props" width="100%" src=".github/components.gif" />
</p>

<p align="center">
  <img alt="Hook snippets: ust, uef, fn, cl" width="100%" src=".github/hooks.gif" />
</p>

</br>

## About

Snippets for **React Native** and **Expo** projects: components, StyleSheet, styled-components, hooks, `FlatList` and Context — in JavaScript and TypeScript.

Works in **VS Code**, **Cursor**, **Windsurf** and **VSCodium** (via [Open VSX](https://open-vsx.org/extension/fabianocs/rn-shortcut)).

### Supported languages

- JavaScript (`.js`)
- JavaScript React (`.jsx`)
- TypeScript (`.ts`)
- TypeScript React (`.tsx`)

---

## Getting started

Install **React Native Shortcut** from the VS Code Marketplace, open any `.js`, `.jsx`, `.ts` or `.tsx` file in VS Code, type a snippet prefix and press `Tab`.

Example: type `rn` and press `Tab` to create a basic React Native component.

---

## Snippets

List of available snippets. **⇥** means the `TAB` key.

|       Snippet | Content                                                    |
| ------------: | ---------------------------------------------------------- |
|        `rn →` | Create a **React Native Component**                        |
|      `rn-s →` | Create a **React Native Component** with inline StyleSheet |
|     `rn-si →` | Create a **React Native Component** importing `./styles`   |
|     `rn-sc →` | Create a **React Native Component** with Styled Components |
|  `rn-style →` | Create a **StyleSheet** file (`styles.ts`)                 |
| `rn-styled →` | Create a **Styled Components** file (`styles.ts`)          |
|  `rn-props →` | Create a **React Native Component** with typed `Props`     |
|     `rn-fl →` | Create a **FlatList** with `keyExtractor` and `renderItem` |
|    `rn-ctx →` | Create a **Context** with Provider and `useXxx()` hook     |

---

## Shortcuts

|      Snippet | Content                               |
| -----------: | ------------------------------------- |
|      `ust →` | Create a new **useState**             |
|      `uef →` | Create a new **useEffect**            |
|       `od →` | Create a new **Object Destructuring** |
|       `fn →` | Create a new **Function**             |
| `fn-async →` | Create a new **Async Function**       |
|       `cl →` | Create a new **Console Log**          |

---

## Contribution

To work on the extension locally (requires Node.js 22+):

```bash
npm install
npm run package        # generates the .vsix file
npm run publish        # VS Code Marketplace
npm run publish:ovsx   # Open VSX (Cursor, Windsurf, VSCodium)
```

Press `F5` in VS Code to open a window with the extension loaded.


Any contribution you make will be **much appreciated**.

#### Find me elsewhere

[![Linkedin Badge](https://img.shields.io/badge/-Linkedin-blue?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/fabianocsouza/)
[![Github Badge](https://img.shields.io/badge/-github.com/fabianocsouza-black?style=flat-square&logo=Github&logoColor=white)](https://github.com/fabianocsouza)

</br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This project is derived from [rocketseat-vscode-react-native-snippets](https://github.com/Rocketseat/rocketseat-vscode-react-native-snippets), originally created by **Claudio Junior** and published by **Rocketseat** under the MIT license.

Modified by Fabiano C. Souza in 2025 and redistributed under the terms of the MIT license.

See the `LICENSE` file for more details.
