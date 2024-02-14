const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
// require('dotenv').config();

// const pat = process.env.MY_PAT;
function cloneRepository(repositoryUrl, destinationDir, branch = "test") {
  execSync(
    `git clone --single-branch --branch ${branch} ${repositoryUrl} ${destinationDir}`
  );
}

function writeToFile(
  markdownFileName,
  markdownContent,
  destinationDir,
  writeToEnd = true
) {
  const destinationFilePath = path.join(destinationDir, markdownFileName);
  if (fs.existsSync(destinationFilePath)) {
    const existingContent = fs.readFileSync(destinationFilePath, "utf8");
    markdownContent = writeToEnd
      ? existingContent.trim() + "\n\n" + markdownContent
      : markdownContent + "\n\n" + existingContent.trim();
  }
  fs.writeFileSync(destinationFilePath, markdownContent);
}

function convertAndCopyFiles(sourceDir, destinationDir) {
  // Recursive function to traverse directories
  function traverseDirectory(directory, markdownFileName = "") {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((item) => {
      if (!item.name.startsWith(".git")) {
        //ignore .git files
        const itemPath = path.join(directory, item.name);
        if (item.isFile()) {
          if (!markdownFileName) {
            //prepare markdown file name based on the directory name
            const lastFolder = path.basename(directory).split(".")[1];
            markdownFileName =
              lastFolder.charAt(0).toUpperCase() + lastFolder.slice(1) + ".md";
          }
          if (!item.name.toLowerCase().startsWith("readme")) {
            //convert js files to markdown
            const fileContent = fs.readFileSync(itemPath, "utf8");
            // Regular expressions to identify single-line and multi-line comments in JavaScript
            const singleLineCommentRegex = /\/\/(.*)/g;
            const multiLineCommentRegex = /\/\*([\s\S]*?)\*\//g;
            let markdownContent = fileContent
              .replace(
                // Replace single-line comments with Markdown comments
                singleLineCommentRegex,
                (match, p1) => `// ${p1.trim()}\n`
              )
              .replace(
                // Replace multi-line comments with Markdown comments
                multiLineCommentRegex,
                (match, p1) => `/*\n${p1.trim()}\n*/\n`
              );
            markdownContent = "```javascript\n" + markdownContent + "\n```";
            writeToFile(markdownFileName, markdownContent, destinationDir);
          } else {
            //Prepend the content of the README file to the destination file.
            let readmeContent = fs.readFileSync(itemPath, "utf8");
            writeToFile(markdownFileName, readmeContent, destinationDir, false);
          }
        } else if (item.isDirectory()) {
          traverseDirectory(itemPath, markdownFileName);
        }
      }
    });
  }
  // Start traversal from the source directory
  traverseDirectory(sourceDir);
}


const repositoryUrls = [
  {
    url: `https://HarshikaMShetty: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@github.com/HarshikaMShetty/Docusaurus-Test.git`,
    branch: "test",
  },
];
const destinationDir = path.join(__dirname, "..", "my-website", "docs"); // Assuming the script is located in the root of your Docusaurus project

async function processRepositories() {
  for (const { url, branch } of repositoryUrls) {
    const tempCloneDir = path.join(__dirname, "temp");
    await cloneRepository(url, tempCloneDir, branch);
    // readContent(tempCloneDir)
    await convertAndCopyFiles(tempCloneDir, destinationDir);
    fs.rmdirSync(tempCloneDir, { recursive: true }); // Clean up temporary clone directory
  }
}

processRepositories().catch((error) => {
  console.error("Error processing repositories:", error);
});
