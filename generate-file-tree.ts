//ensure to install this package npm install @types/node
//before running the npx ts-node generate-file-tree.ts

import fs from "fs";
import path from "path";

const IGNORE_FOLDERS = ["node_modules", ".git", "generate-file-tree.ts"];

function generateTree(dir: string, prefix: string = ""): string {
  let tree = "";

  const files = fs.readdirSync(dir);

  files.forEach((file, index) => {
    if (IGNORE_FOLDERS.includes(file)) return;

    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;

    const connector = isLast ? "└── " : "├── ";

    tree += `${prefix}${connector}${file}\n`;

    if (fs.statSync(filePath).isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      tree += generateTree(filePath, newPrefix);
    }
  });

  return tree;
}

function buildProjectTree(rootDir: string) {
  const projectName = path.basename(rootDir);

  let output = `${projectName}/\n`;
  output += generateTree(rootDir);

  return output;
}

// Root directory (current project)
const ROOT = process.cwd();

const tree = buildProjectTree(ROOT);

// print to terminal
console.log(tree);

// save to file
fs.writeFileSync("project-structure.txt", tree);

console.log("\nProject structure saved to project-structure.txt");